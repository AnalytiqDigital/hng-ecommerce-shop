"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, Mail, MessageCircle, Phone, X } from "lucide-react";
import { useStoreSettings } from "@/components/store-settings-provider";
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from "@/lib/whatsapp";

export function WhatsAppChat() {
  const { settings } = useStoreSettings();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Hello, I have a question about a product.");
  const hasWhatsApp = Boolean(normalizeWhatsAppNumber(settings.whatsappNumber));

  function startChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = buildWhatsAppUrl(settings.whatsappNumber, message);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div className="support-launcher">
      {open && <section id="whatsapp-support" role="dialog" aria-label={`Chat with ${settings.storeName}`} className="support-panel">
        <header className="support-header">
          <span className="support-mark"><MessageCircle size={19} strokeWidth={2.2} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{settings.storeName}</p>
            <p className="mt-0.5 text-[10px] text-white/70">Customer care</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Close chat"><X size={17} /></button>
        </header>
        <div className="support-body">
          <p className="support-time">A direct line to our team</p>
          <div className="support-message">Hello there. How can we help you today?</div>
          {hasWhatsApp ? <form onSubmit={startChat} className="support-compose">
            <label className="sr-only" htmlFor="whatsapp-message">Your message</label>
            <textarea id="whatsapp-message" rows={2} maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-16 flex-1 resize-none bg-transparent px-3 py-2 text-[12px] leading-5 text-ink outline-none placeholder:text-muted" placeholder="Write a message..." />
            <button type="submit" disabled={!message.trim()} className="grid size-10 shrink-0 place-items-center rounded-full bg-[#168a55] text-white transition hover:bg-[#0f7445] disabled:opacity-40" aria-label="Open WhatsApp chat"><ArrowUpRight size={19} /></button>
          </form> : <div className="support-unavailable"><p className="text-[12px] leading-5 text-muted">WhatsApp contact is not set up yet. Send us an email and we’ll get back to you.</p><a href={`mailto:${settings.contactEmail}`} className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-forest underline underline-offset-4"><Mail size={14} />{settings.contactEmail}</a></div>}
          {hasWhatsApp && <p className="support-footnote"><Phone size={11} /> Opens WhatsApp in a new window</p>}
        </div>
      </section>}
      <button type="button" aria-label={open ? "Close WhatsApp chat" : "Open WhatsApp chat"} aria-expanded={open} aria-controls="whatsapp-support" onClick={() => setOpen((current) => !current)} className="support-button">
        {open ? <X size={22} /> : <MessageCircle size={23} strokeWidth={2.1} />}
        <span className="support-button-label">{open ? "Close" : "Chat with us"}</span>
      </button>
    </div>
  );
}