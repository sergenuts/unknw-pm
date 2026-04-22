import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses SERVICE_ROLE key which bypasses RLS.
// Never import this from a client component — the key must stay on the server.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (
  typeof window === "undefined" &&
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] SUPABASE_SERVICE_ROLE_KEY is not set — falling back to anon key. With RLS enabled this will return empty results.",
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
