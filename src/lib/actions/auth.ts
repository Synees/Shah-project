"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

/** Normalkan nomor WhatsApp ke format internasional 62... */
function normalizeWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function registerCustomer(
  formData: FormData
): Promise<RegisterResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const whatsappRaw = String(formData.get("whatsapp") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");

  // --- Validasi input ---
  if (!fullName) {
    return { success: false, error: "Nama lengkap wajib diisi." };
  }
  if (!whatsappRaw) {
    return { success: false, error: "Nomor WhatsApp wajib diisi." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Alamat email tidak valid." };
  }
  if (!password) {
    return { success: false, error: "Kata sandi wajib diisi." };
  }
  // Password min 8 char, max 72 byte (bcrypt limit)
  const passwordBytes = new TextEncoder().encode(password).length;
  if (password.length < 8) {
    return {
      success: false,
      error: "Kata sandi minimal 8 karakter.",
    };
  }
  if (passwordBytes > 72) {
    return {
      success: false,
      error: "Kata sandi terlalu panjang (maksimal 72 byte).",
    };
  }

  const whatsapp = normalizeWhatsApp(whatsappRaw);

  // --- Pengecekan email duplikat awal ---
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      error: "Email sudah terdaftar. Silakan gunakan email lain atau masuk.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        fullName,
        whatsapp,
        email,
        passwordHash,
        role: Role.CUSTOMER,
      },
    });
    return { success: true };
  } catch (err: unknown) {
    // Tangkap race-condition duplikat (P2002)
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        error:
          "Email sudah terdaftar. Silakan gunakan email lain atau masuk.",
      };
    }
    console.error("[registerCustomer]", err);
    return {
      success: false,
      error: "Terjadi kesalahan. Coba lagi dalam beberapa saat.",
    };
  }
}
