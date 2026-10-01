import Link from "next/link";

export default function PrivacyPage() {
  return <main className="mx-auto min-h-[70vh] max-w-[760px] px-5 py-14 sm:px-8"><Link href="/" className="text-[11px] text-muted underline">Form & Field</Link><h1 className="mt-8 font-display text-[42px]">Privacy policy</h1><p className="mt-5 text-[13px] leading-7 text-muted">We use the information you provide to process orders, provide customer support, and maintain your account. Payment details are handled by Paystack and are not stored by this shop. Contact hello@formandfield.store for access, correction, or deletion requests. Replace this starter policy with reviewed legal text before launch.</p><p className="mt-5 text-[11px] text-muted">Last updated October 2026</p></main>;
}