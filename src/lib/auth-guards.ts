/**
 * Shah Project - Server Auth Guards
 * Wajib dipanggil di setiap Server Action dan Route Handler sesuai PRD Bagian 3.1.
 */

import { auth } from "@/auth";
import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  whatsapp: string | null;
}

export class AuthGuardError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthGuardError";
    this.statusCode = statusCode;
  }
}

/**
 * Memverifikasi bahwa pemanggil request telah login.
 * Melempar AuthGuardError jika belum terautentikasi.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AuthGuardError(
      "UNAUTHORIZED: Sesi tidak ditemukan atau telah kedaluwarsa. Silakan masuk terlebih dahulu.",
      401
    );
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: session.user.role as Role,
    whatsapp: session.user.whatsapp ?? null,
  };
}

/**
 * Memverifikasi bahwa pemanggil request memiliki peran ADMIN.
 * Melempar AuthGuardError jika belum login atau bukan ADMIN.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (user.role !== Role.ADMIN) {
    throw new AuthGuardError(
      "FORBIDDEN: Akses terbatas hanya untuk Administrator Shah Project.",
      403
    );
  }

  return user;
}
