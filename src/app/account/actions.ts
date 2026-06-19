"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAdminEmail, requireClientSession, resolveUserProfile } from "@/lib/auth";
import { getRegistrationErrorMessage } from "@/lib/auth-errors";
import { fieldLimits } from "@/lib/field-limits";
import { formString } from "@/lib/form";
import { normalizeLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { accountActionMessages } from "@/lib/localized-action-messages";
import { MAX_ORDER_ATTACHMENT_COUNT } from "@/lib/order-attachments";
import {
  deleteOrderAttachmentFile,
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

function createAccountAuthSchema(messages: ReturnType<typeof accountActionMessages>) {
  return z.object({
    email: z
      .string()
      .trim()
      .email(messages.invalidEmail)
      .max(fieldLimits.login.email.max),
    password: z
      .string()
      .min(fieldLimits.login.password.min, messages.passwordTooShort)
      .max(fieldLimits.login.password.max)
  });
}

function createRegisterSchema(messages: ReturnType<typeof accountActionMessages>) {
  return createAccountAuthSchema(messages).extend({
    fullName: z.string().trim().min(2, messages.fullNameRequired).max(120)
  });
}

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
  const locale = normalizeLocale(formString(formData, "locale"));
  const messages = accountActionMessages(locale);

  if (!hasSupabasePublicEnv()) {
    return { message: messages.signInUnavailable };
  }

  const parsed = createAccountAuthSchema(messages).safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password")
  });
  const claimToken = formString(formData, "claimToken");

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? messages.invalidLoginData };
  }

  const client = await createSupabaseServerClient();

  if (!client) {
    return { message: messages.signInUnavailable };
  }

  const { data, error } = await client.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { message: messages.signInFailed };
  }

  const claimedRequestId = await claimRequestForUser(claimToken, data.user.id);

  redirect(accountRedirectPath("signed-in", claimedRequestId));
}

export async function clientRegisterAction(
  _previousState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const locale = normalizeLocale(formString(formData, "locale"));
  const messages = accountActionMessages(locale);

  if (!hasSupabasePublicEnv()) {
    return { message: messages.registrationUnavailable };
  }

  const parsed = createRegisterSchema(messages).safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    fullName: formString(formData, "fullName")
  });
  const claimToken = formString(formData, "claimToken");

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? messages.invalidRegistrationData };
  }

  const email = parsed.data.email.toLowerCase();
  const adminEmail = getAdminEmail();

  if (adminEmail && email === adminEmail) {
    return { message: messages.adminEmailRestricted };
  }

  const client = await createSupabaseServerClient();

  if (!client) {
    return { message: messages.registrationUnavailable };
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
    return { message: getRegistrationErrorMessage(error, locale) };
  }

  if (data.user) {
    await resolveUserProfile(data.user);
  }

  if (!data.session) {
    const claimQuery = claimToken ? `&claim=${encodeURIComponent(claimToken)}` : "";
    redirect(`/account/login?notice=registration-confirm-email${claimQuery}`);
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

export async function requestOrderContractRevisionAction(formData: FormData): Promise<void> {
  const session = await requireClientSession();
  const requestId = formString(formData, "requestId").trim();
  const contractId = formString(formData, "contractId").trim();
  const feedback = formString(formData, "feedback").trim();

  if (!requestId || !contractId || feedback.length < 10 || feedback.length > 1000) {
    redirect(`/account/requests/${requestId}?notice=order-contract-revision-invalid`);
  }

  const client = await createSupabaseServerClient();

  if (!client) {
    redirect(`/account/requests/${requestId}?notice=order-contract-revision-failed`);
  }

  const { data: request } = await client
    .from("requests")
    .select("id, client_user_id, order_contracts(id, status)")
    .eq("id", requestId)
    .eq("client_user_id", session.id)
    .maybeSingle();
  const contracts = Array.isArray(request?.order_contracts)
    ? request.order_contracts
    : request?.order_contracts
      ? [request.order_contracts]
      : [];

  if (!request || !contracts.some((contract) => contract.id === contractId && contract.status === "sent")) {
    redirect(`/account/requests/${requestId}?notice=order-contract-revision-failed`);
  }

  const { error } = await client.rpc("request_order_contract_revision", {
    target_contract_id: contractId,
    feedback_message: feedback
  });

  if (error) {
    redirect(`/account/requests/${requestId}?notice=order-contract-revision-failed`);
  }

  revalidatePath("/account");
  revalidatePath(`/account/requests/${requestId}`);
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/notifications");
  redirect(`/account/requests/${requestId}?notice=order-contract-revision-requested`);
}

export async function saveClientOrderContractFeedbackAction(formData: FormData): Promise<void> {
  const session = await requireClientSession();
  const requestId = formString(formData, "requestId").trim();
  const contractId = formString(formData, "contractId").trim();
  const message = formString(formData, "message").trim();

  if (
    !requestId ||
    !contractId ||
    message.length < fieldLimits.orderContract.feedback.min ||
    message.length > fieldLimits.orderContract.feedback.max
  ) {
    redirect(`/account/requests/${requestId}?notice=order-comment-invalid`);
  }

  const client = getSupabaseAdminOrThrow();
  const { data: request } = await client
    .from("requests")
    .select("id, client_user_id, order_contracts(id, status)")
    .eq("id", requestId)
    .maybeSingle();
  const contracts = Array.isArray(request?.order_contracts)
    ? request.order_contracts
    : request?.order_contracts
      ? [request.order_contracts]
      : [];
  const contract = contracts.find((item) => item.id === contractId);

  if (
    !request ||
    request.client_user_id !== session.id ||
    !contract ||
    !["draft", "sent", "revision_requested"].includes(contract.status)
  ) {
    redirect(`/account/requests/${requestId}?notice=order-comment-failed`);
  }

  const { error } = await client.from("order_contract_feedback").insert({
    contract_id: contractId,
    request_id: requestId,
    client_user_id: session.id,
    author_role: "client",
    message
  });

  if (error) {
    redirect(`/account/requests/${requestId}?notice=order-comment-failed`);
  }

  revalidatePath("/account");
  revalidatePath(`/account/requests/${requestId}`);
  revalidatePath(`/admin/requests/${requestId}`);
  redirect(`/account/requests/${requestId}?notice=order-comment-saved`);
}

export async function uploadClientOrderAttachmentAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
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
    locale,
    requestId
  });

  if (!upload.ok) {
    redirect(`/account/requests/${requestId}?notice=attachment-failed`);
  }

  revalidatePath("/account");
  revalidatePath(`/account/requests/${requestId}`);
  redirect(`/account/requests/${requestId}?notice=attachment-uploaded`);
}

export async function deleteClientOrderAttachmentAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const session = await requireClientSession();
  const attachmentId = formString(formData, "attachmentId").trim();
  const requestId = formString(formData, "requestId").trim();

  if (!attachmentId || !requestId) {
    redirect("/account");
  }

  const client = getSupabaseAdminOrThrow();
  const { data: request } = await client
    .from("requests")
    .select("id, client_user_id, status, order_attachments(id)")
    .eq("id", requestId)
    .maybeSingle();
  const attachmentRows = Array.isArray(request?.order_attachments)
    ? request.order_attachments
    : [];

  if (
    !request
    || request.client_user_id !== session.id
    || !attachmentRows.some((attachment) => attachment.id === attachmentId)
  ) {
    redirect("/account");
  }

  if (request.status === "completed" || request.status === "rejected") {
    redirect(`/account/requests/${requestId}?notice=attachments-closed`);
  }

  const result = await deleteOrderAttachmentFile(client, {
    actorUserId: session.id,
    attachmentId,
    canDeleteAny: true,
    locale,
    requestId
  });

  if (!result.ok) {
    redirect(`/account/requests/${requestId}?notice=attachment-delete-failed`);
  }

  revalidatePath("/account");
  revalidatePath(`/account/requests/${requestId}`);
  revalidatePath(`/admin/requests/${requestId}`);
  redirect(`/account/requests/${requestId}?notice=attachment-deleted`);
}
