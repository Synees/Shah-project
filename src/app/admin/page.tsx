import { requireAdmin } from "@/lib/auth-guards";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboardPage() {
  let user: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    user = await requireAdmin();
  } catch {
    redirect("/login");
  }

  // Ambil ringkasan inventaris & pesanan
  const [boxCount, productCount, pendingOrderCount] = await Promise.all([
    prisma.boxType.count(),
    prisma.product.count(),
    prisma.order.count({
      where: { status: "MENUNGGU_KONFIRMASI" },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#B8926A]/30 pb-6">
        <h1 className="font-heading text-3xl sm:text-4xl text-[#4E3626] tracking-wide">
          Dashboard Admin
        </h1>
        <p className="text-sm text-[#7B5841] mt-1 font-sans">
          Selamat datang kembali, <span className="text-[#2B211A] font-medium">{user.name}</span>.
        </p>
      </div>

      {/* Metrik Bersih — Gaya Atelier Ledger (tanpa shadow, border tipis, tabular-nums) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#B8926A]/35 divide-y sm:divide-y-0 sm:divide-x divide-[#B8926A]/35 bg-[#FAF7F2]">
        <div className="p-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] mb-2 font-sans">
            Tipe Boks Seserahan
          </p>
          <p className="font-heading text-4xl text-[#2B211A] tabular-nums">
            {boxCount}
          </p>
          <div className="mt-4">
            <Link
              href="/admin/boks"
              className="text-xs text-[#7B5841] hover:text-[#2B211A] underline underline-offset-4"
            >
              Atur kuota boks &rarr;
            </Link>
          </div>
        </div>

        <div className="p-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] mb-2 font-sans">
            Total Produk Katalog
          </p>
          <p className="font-heading text-4xl text-[#2B211A] tabular-nums">
            {productCount}
          </p>
          <div className="mt-4">
            <Link
              href="/admin/katalog"
              className="text-xs text-[#7B5841] hover:text-[#2B211A] underline underline-offset-4"
            >
              Buka katalog produk &rarr;
            </Link>
          </div>
        </div>

        <div className="p-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] mb-2 font-sans">
            Menunggu Konfirmasi
          </p>
          <p className="font-heading text-4xl text-[#2B211A] tabular-nums">
            {pendingOrderCount}
          </p>
          <div className="mt-4">
            <Link
              href="/admin/pesanan"
              className="text-xs text-[#7B5841] hover:text-[#2B211A] underline underline-offset-4"
            >
              Lihat pesanan masuk &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Panduan Cepat Atelier */}
      <div className="border border-[#B8926A]/30 bg-[#F2EBE1]/40 p-6 rounded-[2px] space-y-3">
        <h2 className="font-heading text-xl text-[#4E3626]">
          Pedoman Pengelolaan Inventaris
        </h2>
        <ul className="text-xs text-[#6E5A4B] space-y-2 leading-relaxed">
          <li>
            &bull; <strong className="text-[#2B211A]">Kategori Mahar:</strong> Untuk mahar kuota boks dikosongkan
          </li>
          <li>
            &bull; <strong className="text-[#2B211A]">Kategori Seserahan:</strong> Wajib ditautkan ke salah satu tipe boks untuk alokasi kuota per tanggal acara 
          </li>
          <li>
            &bull; <strong className="text-[#2B211A]">Kompresi Foto:</strong> Seluruh foto dikompresi otomatis ke format WebP (maks. 0.25 MB)
          </li>
        </ul>
      </div>
    </div>
  );
}
