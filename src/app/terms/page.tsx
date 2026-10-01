import Link from "next/link";

export default function TermsPage() {
  return <main className="mx-auto min-h-[70vh] max-w-[760px] px-5 py-14 sm:px-8"><Link href="/" className="text-[11px] text-muted underline">Form & Field</Link><h1 className="mt-8 font-display text-[42px]">Terms & conditions</h1><p className="mt-5 text-[13px] leading-7 text-muted">Orders are subject to product availability and payment confirmation. Prices and delivery details are shown before payment. Returns, cancellations, and delivery timelines should be described in a complete store policy before accepting production orders. Contact hello@formandfield.store with questions.</p><p className="mt-5 text-[11px] text-muted">Replace this starter text with reviewed legal terms before launch.</p></main>;
}