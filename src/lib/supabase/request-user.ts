import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "./server";

export async function getRequestUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization) return getCurrentUser();

  const token = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}
