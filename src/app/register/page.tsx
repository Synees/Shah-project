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
    <main className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo-shah.png"
            alt="Shah Project"
            width={80}
            height={80}
            className="object-contain"
            priority
          />
        </div>

        {/* Heading */}
        <h1 className="font-heading text-4xl text-[#4E3626] text-center mb-2 tracking-wide">
          Buat Akun
        </h1>
        <p className="font-sans text-sm text-[#7B5841] text-center mb-8">
          Daftarkan diri untuk memesan dekorasi pernikahan Shah Project
        </p>

        {/* Card */}
        <div className="bg-white border border-[#E5DDD2] rounded-2xl px-8 py-10 shadow-sm">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            {/* Error */}
            {error && (
              <p
                role="alert"
                className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 font-sans"
              >
                {error}
              </p>
            )}

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-[#4E3626] font-sans"
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
                className="w-full border border-[#D6CABC] rounded-lg px-4 py-2.5 text-sm text-[#2B211A] bg-[#FAF7F2] placeholder:text-[#B8926A]/60 outline-none focus:border-[#7B5841] focus:ring-2 focus:ring-[#7B5841]/15 transition font-sans"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label
                htmlFor="whatsapp"
                className="block text-sm font-medium text-[#4E3626] font-sans"
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
                className="w-full border border-[#D6CABC] rounded-lg px-4 py-2.5 text-sm text-[#2B211A] bg-[#FAF7F2] placeholder:text-[#B8926A]/60 outline-none focus:border-[#7B5841] focus:ring-2 focus:ring-[#7B5841]/15 transition font-sans"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#4E3626] font-sans"
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
                className="w-full border border-[#D6CABC] rounded-lg px-4 py-2.5 text-sm text-[#2B211A] bg-[#FAF7F2] placeholder:text-[#B8926A]/60 outline-none focus:border-[#7B5841] focus:ring-2 focus:ring-[#7B5841]/15 transition font-sans"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#4E3626] font-sans"
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
                  className="w-full border border-[#D6CABC] rounded-lg px-4 py-2.5 pr-11 text-sm text-[#2B211A] bg-[#FAF7F2] placeholder:text-[#B8926A]/60 outline-none focus:border-[#7B5841] focus:ring-2 focus:ring-[#7B5841]/15 transition font-sans"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8926A] hover:text-[#7B5841] transition-colors"
                >
                  {showPassword ? (
                    // Eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-[#7B5841] hover:bg-[#4E3626] disabled:bg-[#B8926A] text-white font-sans font-medium text-sm rounded-lg py-3 transition-colors mt-2"
            >
              {pending ? "Mendaftarkan…" : "Buat Akun"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-[#7B5841] font-sans mt-6">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-[#4E3626] font-semibold underline underline-offset-2 hover:text-[#7B5841] transition-colors"
          >
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
