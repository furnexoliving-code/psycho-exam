import { CONTACT } from "@/lib/contact";

/**
 * The floating WhatsApp button on every public page: Indian students ask
 * and buy over chat, not forms. Bottom right, above everything, with a
 * ready-written first message.
 */
export function WhatsAppButton({ message = "Namaste, mujhe Railway Psycho Test Portal ke baare me jaankari chahiye." }: { message?: string }) {
  const href = `${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] py-2.5 pl-3 pr-4 text-[14px] font-bold text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] hover:brightness-95"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true" fill="currentColor">
        <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.3.7 4.5 1.9 6.4L4 29l7.9-2.1c1.8 1 3.9 1.5 6.1 1.5 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.8c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.7 1.2 1.3-4.5-.3-.4A9.6 9.6 0 0 1 6.1 15c0-5.4 4.4-9.8 9.9-9.8s9.9 4.4 9.9 9.8-4.4 9.8-9.9 9.8zm5.4-7.3c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
      </svg>
      WhatsApp
    </a>
  );
}
