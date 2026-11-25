import { requireAdmin } from "@/lib/auth-guards";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  let user: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    user = await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="font-sans text-xs tracking-widest uppercase text-[#B8926A] mb-2">
            Shah Project — Panel Admin
          </p>
          <h1 className="font-heading text-5xl text-[#4E3626] tracking-wide">
            Dashboard
          </h1>
        </div>

        {/* Welcome card */}
        <div className="bg-white border border-[#E5DDD2] rounded-2xl px-8 py-8 shadow-sm">
          <p className="font-sans text-sm text-[#7B5841] mb-1">
            Masuk sebagai
          </p>
          <p className="font-heading text-2xl text-[#2B211A] mb-6">
            {user.name}
          </p>
          <div className="border-t border-[#F2EBE1] pt-6">
            <p className="font-sans text-sm text-[#7B5841]">
              Panel admin sedang dikembangkan. Fitur manajemen pesanan, kuota
              boks, dan laporan akan tersedia di sini.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
