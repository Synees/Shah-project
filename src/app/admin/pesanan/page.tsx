import { requireAdmin } from "@/lib/auth-guards";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PesananPlaceholderPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#B8926A]/30 pb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#B8926A] mb-1 font-sans">
          Manajemen Transaksi
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl text-[#4E3626] tracking-wide">
          Daftar Pesanan
        </h1>
        <p className="text-sm text-[#7B5841] mt-2 font-sans max-w-2xl leading-relaxed">
          Modul pemrosesan pesanan, input ongkos kirim, persetujuan kuota, dan verifikasi bukti transfer akan dikembangkan pada tahap selanjutnya.
        </p>
      </div>

      {/* Atelier Ledger Notice Box */}
      <div className="bg-[#F2EBE1]/60 border border-[#B8926A]/35 p-8 rounded-[2px]">
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#B8926A] rounded-full inline-block" />
            <span className="text-[11px] uppercase tracking-[0.16em] text-[#4E3626] font-semibold">
              Status Pengerjaan
            </span>
          </div>
          <p className="text-sm text-[#6E5A4B] leading-relaxed">
            Halaman ini disiapkan sebagai alur transaksi Shah Project. Saat ini Anda dapat mengelola inventaris boks seserahan dan katalog produk mahar.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/admin/boks"
              className="inline-block text-[11px] uppercase tracking-[0.14em] text-white bg-[#4E3626] hover:bg-[#2B211A] px-4 py-2.5 rounded-[2px] transition-colors"
            >
              Kelola Tipe Boks &rarr;
            </Link>
            <Link
              href="/admin/katalog"
              className="inline-block text-[11px] uppercase tracking-[0.14em] text-[#4E3626] border border-[#B8926A]/45 hover:border-[#4E3626] px-4 py-2.5 rounded-[2px] transition-colors"
            >
              Kelola Katalog &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
