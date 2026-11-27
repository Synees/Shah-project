"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Email atau password salah.");
        return;
      }

      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;

      if (role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
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
            Setiap mahar dirangkai dari detail yang dipilih khusus untuk hari istimewa Anda.
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
            Masuk ke Akun
          </h1>

          <form onSubmit={handleSubmit} noValidate className="space-y-7">
            {/* Error */}
            {error && (
              <p
                role="alert"
                className="text-xs text-red-700 border-l-2 border-red-400 pl-3 font-sans py-1"
              >
                {error}
              </p>
            )}

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
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-transparent border border-[#B8926A]/45 rounded-[2px] px-3 py-3 text-sm text-[#2B211A] placeholder:text-[#B8926A]/50 outline-none focus:border-[#4E3626] transition-colors font-sans"
              />
            </div>

            {/* Tombol */}
            <button
              type="submit"
              disabled={pending}
              className="w-full h-12 bg-[#4E3626] hover:bg-[#2B211A] disabled:bg-[#B8926A] text-white font-sans font-medium text-xs tracking-[0.12em] uppercase rounded-[2px] transition-colors mt-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {pending ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Link daftar */}
          <p className="text-sm text-[#7B5841] font-sans mt-8">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-[#4E3626] font-semibold underline underline-offset-2 hover:text-[#2B211A] transition-colors"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
