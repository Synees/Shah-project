"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { registerCustomer } from "@/lib/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);

    startTransition(async () => {
      const result = await registerCustomer(fd);
      if (result.success) {
        router.push("/login?registered=1");
      } else {
        setError(result.error ?? "Terjadi kesalahan. Coba lagi.");
      }
    });
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12">
      {/* ── Kolom kiri: identitas merek ── */}
      <aside className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-[#F2EBE1] border-r border-[#B8926A]/35 p-12 xl:p-16">
        {/* Logo */}
        <div>
          <Image
            src="/images/logo-shah.png"
            alt="Shah Project"
            width={130}
            height={130}
            className="object-contain"
            priority
          />
        </div>

        {/* Kutipan kuratorial */}
        <div>
          <div className="w-8 h-px bg-[#B8926A] mb-8" aria-hidden="true" />
          <blockquote className="font-heading text-3xl xl:text-4xl text-[#2B211A] leading-snug mb-6">
            Kuota dibuka terbatas setiap bulannya.
          </blockquote>
        </div>

        {/* Catatan studio */}
        <p className="font-sans text-xs text-[#B8926A] tracking-wide">
          Katalog Mahar & Seserahan
        </p>
      </aside>

      {/* ── Kolom kanan: formulir ── */}
      <section className="lg:col-span-7 flex items-center justify-center bg-[#FAF7F2] px-6 py-16 lg:py-0">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex justify-center mb-10 lg:hidden">
            <Image
              src="/images/logo-shah.png"
              alt="Shah Project"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          {/* Judul */}
          <h1 className="font-heading text-4xl xl:text-5xl text-[#4E3626] mb-2 tracking-wide">
            Registrasi Klien
          </h1>

          {/* Formulir — langsung di kanvas, tanpa kartu */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
          >
            {/* Error */}
            {error && (
              <p
                role="alert"
                className="text-xs text-red-700 border-l-2 border-red-400 pl-3 font-sans py-1"
              >
                {error}
              </p>
            )}

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
              >
                Nama Lengkap
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Nama sesuai undangan"
                className="w-full bg-transparent border border-[#B8926A]/45 rounded-[2px] px-3 py-3 text-sm text-[#2B211A] placeholder:text-[#B8926A]/50 outline-none focus:border-[#4E3626] transition-colors font-sans"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label
                htmlFor="whatsapp"
                className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
              >
                Nomor WhatsApp
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                required
                autoComplete="tel"
                placeholder="08xx atau 628xx"
                className="w-full bg-transparent border border-[#B8926A]/45 rounded-[2px] px-3 py-3 text-sm text-[#2B211A] placeholder:text-[#B8926A]/50 outline-none focus:border-[#4E3626] transition-colors font-sans"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@email.com"
                className="w-full bg-transparent border border-[#B8926A]/45 rounded-[2px] px-3 py-3 text-sm text-[#2B211A] placeholder:text-[#B8926A]/50 outline-none focus:border-[#4E3626] transition-colors font-sans"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  className="w-full bg-transparent border border-[#B8926A]/45 rounded-[2px] px-3 py-3 pr-11 text-sm text-[#2B211A] placeholder:text-[#B8926A]/50 outline-none focus:border-[#4E3626] transition-colors font-sans"
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8926A] hover:text-[#4E3626] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Tombol */}
            <button
              type="submit"
              disabled={pending}
              className="w-full h-12 bg-[#4E3626] hover:bg-[#2B211A] disabled:bg-[#B8926A] text-white font-sans font-medium text-xs tracking-[0.12em] uppercase rounded-[2px] transition-colors mt-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {pending ? "Mendaftarkan..." : "Buat Akun"}
            </button>
          </form>

          {/* Link masuk */}
          <p className="text-sm text-[#7B5841] font-sans mt-8">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-[#4E3626] font-semibold underline underline-offset-2 hover:text-[#2B211A] transition-colors"
            >
              Masuk
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
