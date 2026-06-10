"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAdminEmail, requireClientSession, resolveUserProfile } from "@/lib/auth";
import { getRegistrationErrorMessage } from "@/lib/auth-errors";
import { fieldLimits } from "@/lib/field-limits";
import { formString } from "@/lib/form";
import { MAX_ORDER_ATTACHMENT_COUNT } from "@/lib/order-attachments";
import {
  getOrderAttachmentFiles,
  uploadOrderAttachmentFiles
} from "@/lib/order-attachment-storage";
import { hashClaimToken, isClaimTokenExpired } from "@/lib/request-claim";
import {
  createSupabaseServerClient,
  getSupabaseAdminOrThrow,
  hasSupabasePublicEnv
} from "@/lib/supabase/server";

export type AccountFormState = {
  message?: string;
};

const accountAuthSchema = z.object({
  email: z.string().trim().email("Введите корректный email").max(fieldLimits.login.email.max),
  password: z
    .string()
    .min(fieldLimits.login.password.min, "Пароль должен быть длиннее")
    .max(fieldLimits.login.password.max)
});

const registerSchema = accountAuthSchema.extend({
  fullName: z.string().trim().min(2, "Укажите имя").max(120)
});

async function claimRequestForUser(token: string, userId: string): Promise<string | null> {
  if (!token) {
    return null;
  }

  const client = getSupabaseAdminOrThrow();
  const tokenHash = hashClaimToken(token);
  const { data: claim, error } = await client
    .from("request_claim_tokens")
    .select("id, request_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !claim || claim.used_at || isClaimTokenExpired(claim.expires_at)) {
    return null;
  }

  const { data: request } = await client
    .from("requests")
    .select("id, client_user_id")
    .eq("id", claim.request_id)
    .maybeSingle();

  if (!request || request.client_user_id) {
    return null;
  }

  const { data: updatedRequest, error: updateError } = await client
    .from("requests")
    .update({ client_user_id: userId })
    .eq("id", claim.request_id)
    .is("client_user_id", null)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedRequest) {
    return null;
  }

  await client
    .from("order_attachments")
    .update({ client_user_id: userId })
    .eq("request_id", updatedRequest.id);
  await client
    .from("request_claim_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", claim.id);

  revalidatePath("/account");
  revalidatePath(`/account/requests/${updatedRequest.id}`);

  return updatedRequest.id;
}

function accountRedirectPath(notice: string, claimedRequestId: string | null): string {
  return claimedRequestId
    ? `/account/requests/${claimedRequestId}?notice=request-claimed`
    : `/account?notice=${notice}`;
}

export async function clientLoginAction(
  _previousState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  if (!hasSupabasePublicEnv()) {
    return { message: "Вход временно недоступен. Попробуйте позже." };
  }

  const parsed = accountAuthSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password")
  });
  const claimToken = formString(formData, "claimToken");

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Проверьте данные входа." };
  }

  const client = await createSupabaseServerClient();

  if (!client) {
    return { message: "Вход временно недоступен. Попробуйте позже." };
  }

  const { data, error } = await client.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { message: "Не удалось войти. Проверьте email и пароль." };
  }

  const claimedRequestId = await claimRequestForUser(claimToken, data.user.id);

  redirect(accountRedirectPath("signed-in", claimedRequestId));
}

export async function clientRegisterAction(
  _previousState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  if (!hasSupabasePublicEnv()) {
    return { message: "Регистрация временно недоступна. Попробуйте позже." };
  }

  const parsed = registerSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    fullName: formString(formData, "fullName")
  });
  const claimToken = formString(formData, "claimToken");

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Проверьте данные регистрации." };
  }

  const email = parsed.data.email.toLowerCase();
  const adminEmail = getAdminEmail();

  if (adminEmail && email === adminEmail) {
    return {
      message:
        "Этот email используется для административного доступа. Войдите через административную панель."
    };
  }

  const client = await createSupabaseServerClient();

  if (!client) {
    return { message: "Регистрация временно недоступна. Попробуйте позже." };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName
      }
    }
  });

  if (error) {
    return { message: getRegistrationErrorMessage(error) };
  }

  if (data.user) {
    await resolveUserProfile(data.user);
  }

  if (!data.session) {
    return { message: "Регистрация создана. Проверьте почту, если включено подтверждение email." };
  }

  const claimedRequestId = data.user ? await claimRequestForUser(claimToken, data.user.id) : null;

  redirect(accountRedirectPath("registered", claimedRequestId));
}

export async function clientSignOutAction(): Promise<void> {
  const client = await createSupabaseServerClient();

  if (client) {
    await client.auth.signOut();
  }

  redirect("/");
}

export async function acceptOrderContractAction(formData: FormData): Promise<void> {
  const session = await requireClientSession();
  const requestId = formString(formData, "requestId").trim();
  const contractId = formString(formData, "contractId").trim();

  if (!requestId || !contractId) {
    redirect("/account");
  }

  const client = getSupabaseAdminOrThrow();
  const { data: request } = await client
    .from("requests")
    .select("id, client_user_id, order_contracts(id, status)")
    .eq("id", requestId)
    .maybeSingle();
  const contractRows = Array.isArray(request?.order_contracts)
    ? request.order_contracts
    : request?.order_contracts
      ? [request.order_contracts]
      : [];
  const contract = contractRows.find((item) => item.id === contractId);

  if (request?.client_user_id !== session.id || !contract || contract.status !== "sent") {
    redirect("/account");
  }

  const { data: acceptedContract, error: acceptError } = await client
    .from("order_contracts")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", contractId)
    .eq("status", "sent")
    .select("id")
    .maybeSingle();

  if (acceptError || !acceptedContract) {
    redirect("/account?notice=order-contract-accept-failed");
  }

  revalidatePath("/account");
  revalidatePath(`/account/requests/${requestId}`);
  redirect(`/account/requests/${requestId}?notice=order-contract-accepted`);
}

export async function uploadClientOrderAttachmentAction(formData: FormData): Promise<void> {
  const session = await requireClientSession();
  const requestId = formString(formData, "requestId").trim();

  if (!requestId) {
    redirect("/account");
  }

  const client = getSupabaseAdminOrThrow();
  const { data: request } = await client
    .from("requests")
    .select("id, client_user_id, status, order_attachments(id)")
    .eq("id", requestId)
    .maybeSingle();

  if (!request || request.client_user_id !== session.id) {
    redirect("/account");
  }

  if (request.status === "completed" || request.status === "rejected") {
    redirect(`/account/requests/${requestId}?notice=attachments-closed`);
  }

  const files = getOrderAttachmentFiles(formData);
  const existingAttachments = Array.isArray(request.order_attachments)
    ? request.order_attachments.length
    : 0;

  if (!files.length) {
    redirect(`/account/requests/${requestId}?notice=attachment-empty`);
  }

  if (existingAttachments + files.length > MAX_ORDER_ATTACHMENT_COUNT) {
    redirect(`/account/requests/${requestId}?notice=attachment-limit`);
  }

  const upload = await uploadOrderAttachmentFiles(client, {
    clientUserId: session.id,
    files,
    requestId
  });

  if (!upload.ok) {
    redirect(`/account/requests/${requestId}?notice=attachment-failed`);
  }

  revalidatePath("/account");
  revalidatePath(`/account/requests/${requestId}`);
  redirect(`/account/requests/${requestId}?notice=attachment-uploaded`);
}
