/**
 * Shah Project - WhatsApp Link & Notification Generator
 * Menghasilkan tautan https://wa.me/... dengan template pesan sesuai status pesanan.
 * Sesuai PRD Bagian 3.10 (notifikasi langsung tanpa gateway berbayar).
 */

import { formatDateTimeWIB, formatDateDisplay } from "@/lib/time";

export interface OrderWhatsAppContext {
  orderCode: string;
  customerName: string;
  customerWhatsapp: string;
  eventDate: Date | string;
  subtotal: number;
  shippingCost?: number;
  totalAmount: number;
  paymentDeadline?: Date | null;
  rejectionNote?: string | null;
  refundNote?: string | null;
  finalReportImageUrl?: string | null;
  trackingUrl?: string;
}

/**
 * Menormalkan nomor telepon ke format internasional standar WhatsApp (tanpa tanda '+', diawali '62')
 * Contoh: "0812-3456-7890" -> "6281234567890"
 */
export function normalizeWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
}

/**
 * Membuat tautan wa.me lengkap dengan teks pesan yang telah di-URL-encode
 */
export function createWhatsAppLink(phone: string, message: string): string {
  const normalizedPhone = normalizeWhatsAppNumber(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message.trim())}`;
}

/**
 * Format mata uang Rupiah
 */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Template 1: Pesanan Disetujui / Menunggu Pembayaran (MENUNGGU_PEMBAYARAN)
 */
export function getApprovedOrderMessage(ctx: OrderWhatsAppContext): string {
  const deadlineStr = ctx.paymentDeadline
    ? formatDateTimeWIB(ctx.paymentDeadline)
    : "24 jam sejak pesan ini diterima";
  const eventDateStr = formatDateDisplay(ctx.eventDate);

  return `Halo Kak ${ctx.customerName}, salam hangat dari *Shah Project* ✨

Kabar baik! Pesanan Kakak dengan kode *${ctx.orderCode}* untuk acara tanggal *${eventDateStr}* telah *DISETUJUI* oleh owner.

📋 *Rincian Pembayaran:*
• Subtotal: ${formatRupiah(ctx.subtotal)}
• Ongkos Kirim: ${formatRupiah(ctx.shippingCost || 0)}
• *Total Pembayaran: ${formatRupiah(ctx.totalAmount)}*

💳 *Rekening Pembayaran Shah Project:*
• Bank BCA: *1234567890* a.n. Shah Project
• Bank Mandiri: *0987654321* a.n. Shah Project

⏳ *Batas Waktu Pembayaran:*
Mohon menyelesaikan pembayaran 100% dan mengunggah bukti transfer sebelum:
*${deadlineStr}*

Silakan unggah bukti transfer melalui halaman tracking pesanan Kakak:
${ctx.trackingUrl || "https://shahproject.vercel.app/orders/" + ctx.orderCode}

Terima kasih atas kepercayaannya mempercayakan momen spesial bersama Shah Project! 🙏`;
}

/**
 * Template 2: Bukti Pembayaran Ditolak (PEMBAYARAN_DITOLAK)
 */
export function getPaymentRejectedMessage(ctx: OrderWhatsAppContext): string {
  const deadlineStr = ctx.paymentDeadline
    ? formatDateTimeWIB(ctx.paymentDeadline)
    : "24 jam ke depan";

  return `Halo Kak ${ctx.customerName}, kami dari *Shah Project*.

Mohon maaf, bukti pembayaran yang Kakak unggah untuk pesanan *${ctx.orderCode}* belum dapat kami verifikasi.

📝 *Catatan Pemeriksaan:*
"${ctx.rejectionNote || "Bukti transfer tidak terbaca atau nominal tidak sesuai."}"

⏳ *Perpanjangan Waktu:*
Batas waktu pembayaran telah kami perpanjang 24 jam hingga:
*${deadlineStr}*

Mohon segera mengunggah ulang foto bukti transfer yang valid melalui tautan berikut:
${ctx.trackingUrl || "https://shahproject.vercel.app/orders/" + ctx.orderCode}

Jika ada kendala mutasi atau salah transfer, silakan balas pesan ini ya Kak. Terima kasih! 🙏`;
}

/**
 * Template 3: Pesanan Selesai (SELESAI)
 */
export function getOrderCompletedMessage(ctx: OrderWhatsAppContext): string {
  const reportUrl = ctx.finalReportImageUrl
    ? `\n\n📸 *Foto Hasil Akhir:*\n${ctx.finalReportImageUrl}`
    : "";

  return `Halo Kak ${ctx.customerName}! ✨

Alhamdulillah, pesanan mahar / boks seserahan Kakak dengan kode *${ctx.orderCode}* telah *SELESAI* dihias dengan penuh ketelitian oleh tim Shah Project.${reportUrl}

Barang pesanan Kakak kini telah siap diambil / dijadwalkan untuk pengantaran sesuai kesepakatan.

Detail pesanan dapat dilihat di:
${ctx.trackingUrl || "https://shahproject.vercel.app/orders/" + ctx.orderCode}

Semoga lancar dan berkah seluruh rangkaian acara pernikahannya ya Kak. Terima kasih banyak telah mempercayai *Shah Project*! 🤍💐`;
}

/**
 * Template 4: Pembatalan Disetujui & Refund Diproses (DIBATALKAN_REFUND)
 */
export function getRefundProcessedMessage(ctx: OrderWhatsAppContext): string {
  const noteStr = ctx.refundNote ? `\n• Catatan / No. Referensi Transfer: ${ctx.refundNote}` : "";

  return `Halo Kak ${ctx.customerName}, kami dari *Shah Project*.

Pemberitahuan bahwa permohonan pembatalan pesanan *${ctx.orderCode}* telah kami setujui.

Dana pembayaran Kakak sebesar *${formatRupiah(ctx.totalAmount)}* telah kami kembalikan (refund 100%) ke rekening Kakak.${noteStr}

Mohon dapat memeriksa mutasi rekening tujuan. Jika dalam waktu 1x24 jam dana belum masuk, silakan hubungi kami kembali.

Terima kasih atas pengertian dan kerjasamanya Kak. 🙏`;
}

/**
 * Helper terpadu untuk mendapatkan URL WhatsApp berdasarkan tipe status
 */
export function getWhatsAppUpdateLink(
  type: "APPROVED" | "PAYMENT_REJECTED" | "COMPLETED" | "REFUNDED",
  ctx: OrderWhatsAppContext
): string {
  let message = "";

  switch (type) {
    case "APPROVED":
      message = getApprovedOrderMessage(ctx);
      break;
    case "PAYMENT_REJECTED":
      message = getPaymentRejectedMessage(ctx);
      break;
    case "COMPLETED":
      message = getOrderCompletedMessage(ctx);
      break;
    case "REFUNDED":
      message = getRefundProcessedMessage(ctx);
      break;
  }

  return createWhatsAppLink(ctx.customerWhatsapp, message);
}
