export const WHATSAPP_URL = "https://wa.me/51969787221";

export function isWhatsAppLink(label?: string, url?: string) {
  return (
    /whatsapp/i.test(label || "") ||
    /(?:wa\.me|api\.whatsapp\.com|whatsapp\.com)/i.test(url || "")
  );
}

export function normalizeWhatsAppUrl(label?: string, url?: string) {
  return isWhatsAppLink(label, url) ? WHATSAPP_URL : url;
}
