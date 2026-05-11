import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

function getSupabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
}

function getSupabasePublicKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    null
  );
}

function getSupabaseSecretKey(): string | null {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null
  );
}

export function hasSupabasePublicEnv(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}

export function hasSupabaseAdminEnv(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseSecretKey());
}

export function getOptionalSupabasePublic(): SupabaseClient | null {
  const supabaseUrl = getSupabaseUrl();
  const publicKey = getSupabasePublicKey();

  if (!supabaseUrl || !publicKey) {
    return null;
  }

  if (!publicClient) {
    publicClient = createClient(supabaseUrl, publicKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return publicClient;
}

export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const supabaseUrl = getSupabaseUrl();
  const publicKey = getSupabasePublicKey();

  if (!supabaseUrl || !publicKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    publicKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies. Server Actions can.
          }
        }
      }
    }
  );
}

export function getOptionalSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = getSupabaseUrl();
  const secretKey = getSupabaseSecretKey();

  if (!supabaseUrl || !secretKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return adminClient;
}

export function getSupabaseAdminOrThrow(): SupabaseClient {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY."
    );
  }

  return client;
}
