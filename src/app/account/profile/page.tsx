import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <main className="mx-auto min-h-[70vh] max-w-[800px] px-5 py-12 sm:px-8 lg:px-12"><Link href="/account" className="text-[11px] text-muted underline">Back to account</Link><p className="mt-7 text-[10px] uppercase tracking-[0.18em] text-clay">Account profile</p><h1 className="mt-2 font-display text-[42px]">Your details</h1><dl className="mt-8 border-t border-line text-[13px]"><div className="grid grid-cols-[130px_1fr] gap-4 border-b border-line py-4"><dt className="text-muted">Name</dt><dd>{user.user_metadata.full_name ?? user.user_metadata.name ?? "Not provided"}</dd></div><div className="grid grid-cols-[130px_1fr] gap-4 border-b border-line py-4"><dt className="text-muted">Email</dt><dd>{user.email}</dd></div><div className="grid grid-cols-[130px_1fr] gap-4 border-b border-line py-4"><dt className="text-muted">Phone</dt><dd>{user.phone ?? "Not provided"}</dd></div></dl><p className="mt-5 text-[11px] text-muted">Profile details are managed by your Google account.</p></main>;
}