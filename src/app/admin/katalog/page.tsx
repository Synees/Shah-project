import { requireAdmin } from "@/lib/auth-guards";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductClient } from "./product-client";

export default async function AdminKatalogPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const [products, boxTypes] = await Promise.all([
    prisma.product.findMany({
      include: {
        boxType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.boxType.findMany({
      select: {
        id: true,
        name: true,
        totalQuota: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return <ProductClient initialProducts={products} boxTypes={boxTypes} />;
}
