"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";

export interface BoxTypeActionResult {
  success: boolean;
  error?: string;
}

export async function createBoxType(
  formData: FormData
): Promise<BoxTypeActionResult> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const description = descriptionRaw ? descriptionRaw : null;
  const totalQuotaRaw = Number(formData.get("totalQuota"));

  if (!name) {
    return { success: false, error: "Nama tipe boks wajib diisi." };
  }

  if (isNaN(totalQuotaRaw) || totalQuotaRaw < 1) {
    return { success: false, error: "Kuota total minimal 1 unit." };
  }

  const totalQuota = Math.floor(totalQuotaRaw);

  try {
    await prisma.boxType.create({
      data: {
        name,
        description,
        totalQuota,
      },
    });

    revalidatePath("/admin/boks");
    revalidatePath("/admin/katalog");
    return { success: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        error: "Nama tipe boks sudah digunakan. Gunakan nama lain.",
      };
    }
    console.error("[createBoxType]", err);
    return {
      success: false,
      error: "Gagal menyimpan tipe boks. Silakan coba lagi.",
    };
  }
}

export async function updateBoxType(
  id: string,
  formData: FormData
): Promise<BoxTypeActionResult> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "ID tipe boks tidak valid." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const description = descriptionRaw ? descriptionRaw : null;
  const totalQuotaRaw = Number(formData.get("totalQuota"));

  if (!name) {
    return { success: false, error: "Nama tipe boks wajib diisi." };
  }

  if (isNaN(totalQuotaRaw) || totalQuotaRaw < 1) {
    return { success: false, error: "Kuota total minimal 1 unit." };
  }

  const totalQuota = Math.floor(totalQuotaRaw);

  try {
    await prisma.boxType.update({
      where: { id },
      data: {
        name,
        description,
        totalQuota,
      },
    });

    revalidatePath("/admin/boks");
    revalidatePath("/admin/katalog");
    return { success: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        error: "Nama tipe boks sudah digunakan. Gunakan nama lain.",
      };
    }
    console.error("[updateBoxType]", err);
    return {
      success: false,
      error: "Gagal memperbarui tipe boks. Silakan coba lagi.",
    };
  }
}
