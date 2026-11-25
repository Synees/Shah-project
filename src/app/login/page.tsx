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

      // Ambil session untuk cek role
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
    <main className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
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
          Masuk
        </h1>
        <p className="font-sans text-sm text-[#7B5841] text-center mb-8">
          Selamat datang kembali di Shah Project
        </p>

        {/* Card */}
        <div className="bg-white border border-[#E5DDD2] rounded-2xl px-8 py-10 shadow-sm">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Error */}
            {error && (
              <p
                role="alert"
                className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 font-sans"
              >
                {error}
              </p>
            )}

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
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-[#D6CABC] rounded-lg px-4 py-2.5 text-sm text-[#2B211A] bg-[#FAF7F2] placeholder:text-[#B8926A]/60 outline-none focus:border-[#7B5841] focus:ring-2 focus:ring-[#7B5841]/15 transition font-sans"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-[#7B5841] hover:bg-[#4E3626] disabled:bg-[#B8926A] text-white font-sans font-medium text-sm rounded-lg py-3 transition-colors mt-2"
            >
              {pending ? "Memproses…" : "Masuk"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-[#7B5841] font-sans mt-6">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-[#4E3626] font-semibold underline underline-offset-2 hover:text-[#7B5841] transition-colors"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </main>
  );
}
