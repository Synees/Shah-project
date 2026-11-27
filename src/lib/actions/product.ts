"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { ProductCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface ProductActionResult {
  success: boolean;
  error?: string;
}

export interface ProductInputData {
  name: string;
  category: ProductCategory;
  boxTypeId?: string | null;
  price: number;
  description: string;
  imageUrl: string;
  isActive?: boolean;
}

export async function createProduct(
  data: ProductInputData
): Promise<ProductActionResult> {
  await requireAdmin();

  const name = (data.name ?? "").trim();
  const description = (data.description ?? "").trim();
  const imageUrl = (data.imageUrl ?? "").trim();
  const price = Number(data.price);
  const category = data.category;
  let boxTypeId = data.boxTypeId ? data.boxTypeId.trim() : null;
  const isActive = data.isActive ?? true;

  if (!name) {
    return { success: false, error: "Nama produk wajib diisi." };
  }
  if (!description) {
    return { success: false, error: "Deskripsi produk wajib diisi." };
  }
  if (!imageUrl) {
    return { success: false, error: "Foto produk wajib diunggah." };
  }
  if (isNaN(price) || price < 0) {
    return { success: false, error: "Harga produk harus berupa angka positif." };
  }
  if (![ProductCategory.MAHAR, ProductCategory.SESERAHAN].includes(category)) {
    return { success: false, error: "Kategori produk tidak valid." };
  }

  // Aturan Bisnis: MAHAR paksa boxTypeId null; SESERAHAN wajib pilih boxTypeId
  if (category === ProductCategory.MAHAR) {
    boxTypeId = null;
  } else if (category === ProductCategory.SESERAHAN) {
    if (!boxTypeId) {
      return {
        success: false,
        error: "Produk kategori Seserahan wajib memilih tipe boks.",
      };
    }
    const boxExists = await prisma.boxType.findUnique({
      where: { id: boxTypeId },
    });
    if (!boxExists) {
      return { success: false, error: "Tipe boks yang dipilih tidak ditemukan." };
    }
  }

  try {
    await prisma.product.create({
      data: {
        name,
        category,
        boxTypeId,
        price: Math.floor(price),
        description,
        imageUrl,
        isActive,
      },
    });

    revalidatePath("/admin/katalog");
    revalidatePath("/admin/boks");
    return { success: true };
  } catch (err) {
    console.error("[createProduct]", err);
    return {
      success: false,
      error: "Gagal menyimpan produk ke katalog. Silakan coba lagi.",
    };
  }
}

export async function updateProduct(
  id: string,
  data: ProductInputData
): Promise<ProductActionResult> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "ID produk tidak valid." };
  }

  const name = (data.name ?? "").trim();
  const description = (data.description ?? "").trim();
  const imageUrl = (data.imageUrl ?? "").trim();
  const price = Number(data.price);
  const category = data.category;
  let boxTypeId = data.boxTypeId ? data.boxTypeId.trim() : null;
  const isActive = data.isActive ?? true;

  if (!name) {
    return { success: false, error: "Nama produk wajib diisi." };
  }
  if (!description) {
    return { success: false, error: "Deskripsi produk wajib diisi." };
  }
  if (!imageUrl) {
    return { success: false, error: "Foto produk wajib diunggah." };
  }
  if (isNaN(price) || price < 0) {
    return { success: false, error: "Harga produk harus berupa angka positif." };
  }
  if (![ProductCategory.MAHAR, ProductCategory.SESERAHAN].includes(category)) {
    return { success: false, error: "Kategori produk tidak valid." };
  }

  // Aturan Bisnis: MAHAR paksa boxTypeId null; SESERAHAN wajib pilih boxTypeId
  if (category === ProductCategory.MAHAR) {
    boxTypeId = null;
  } else if (category === ProductCategory.SESERAHAN) {
    if (!boxTypeId) {
      return {
        success: false,
        error: "Produk kategori Seserahan wajib memilih tipe boks.",
      };
    }
    const boxExists = await prisma.boxType.findUnique({
      where: { id: boxTypeId },
    });
    if (!boxExists) {
      return { success: false, error: "Tipe boks yang dipilih tidak ditemukan." };
    }
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        boxTypeId,
        price: Math.floor(price),
        description,
        imageUrl,
        isActive,
      },
    });

    revalidatePath("/admin/katalog");
    revalidatePath("/admin/boks");
    return { success: true };
  } catch (err) {
    console.error("[updateProduct]", err);
    return {
      success: false,
      error: "Gagal memperbarui produk katalog. Silakan coba lagi.",
    };
  }
}

export async function toggleProductActive(
  id: string
): Promise<ProductActionResult> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "ID produk tidak valid." };
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!existing) {
      return { success: false, error: "Produk tidak ditemukan." };
    }

    await prisma.product.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
    });

    revalidatePath("/admin/katalog");
    return { success: true };
  } catch (err) {
    console.error("[toggleProductActive]", err);
    return {
      success: false,
      error: "Gagal mengubah status aktif produk.",
    };
  }
}

export async function deleteProduct(
  id: string
): Promise<ProductActionResult> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "ID produk tidak valid." };
  }

  try {
    const countItems = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (countItems > 0) {
      return {
        success: false,
        error:
          "Produk ini tercatat dalam riwayat pesanan klien dan tidak dapat dihapus permanen. Nonaktifkan status produk agar tidak tampil di katalog publik.",
      };
    }

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/admin/katalog");
    revalidatePath("/admin/boks");
    return { success: true };
  } catch (err) {
    console.error("[deleteProduct]", err);
    return {
      success: false,
      error: "Gagal menghapus produk. Silakan coba lagi.",
    };
  }
}
