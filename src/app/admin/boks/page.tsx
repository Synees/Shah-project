import { requireAdmin } from "@/lib/auth-guards";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BoxClient } from "./box-client";

export default async function AdminBoksPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const boxes = await prisma.boxType.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return <BoxClient initialBoxes={boxes} />;
}
