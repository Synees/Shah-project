"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { OrderStatus, ProductCategory } from "@prisma/client";

/**
 * Menandai barang seserahan dari pelanggan telah diterima (itemsReceivedAt).
 * Hanya jika status order DIPROSES dan order memuat item kategori SESERAHAN.
 * Mengisi itemsReceivedAt dengan waktu sekarang jika masih kosong.
 * Tidak mengubah status order.
 */
export async function markItemsReceived(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Pesanan tidak ditemukan.");
  }

  if (order.status !== OrderStatus.DIPROSES) {
    throw new Error(
      `Barang hanya dapat ditandai diterima saat status order DIPROSES (status saat ini: ${order.status}).`
    );
  }

  const hasSeserahan = order.items.some(
    (item) => item.product.category === ProductCategory.SESERAHAN
  );

  if (!hasSeserahan) {
    throw new Error("Pesanan ini tidak memuat item kategori SESERAHAN.");
  }

  if (order.itemsReceivedAt) {
    return order;
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: {
      itemsReceivedAt: new Date(),
    },
  });
}

/**
 * Menandai pesanan telah diserahkan / diambil pelanggan (handedOverAt).
 * Hanya jika status order DIPROSES.
 * Mengisi handedOverAt jika masih kosong.
 * Tidak mengubah status order.
 */
export async function markHandedOver(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Pesanan tidak ditemukan.");
  }

  if (order.status !== OrderStatus.DIPROSES) {
    throw new Error(
      `Pesanan hanya dapat ditandai diserahkan saat status order DIPROSES (status saat ini: ${order.status}).`
    );
  }

  if (order.handedOverAt) {
    return order;
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: {
      handedOverAt: new Date(),
    },
  });
}
