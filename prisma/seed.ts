import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Memulai proses seeding database Shah Project...");

  // 1. Seed 3 Tipe Boks Seserahan (@10 unit per tanggal)
  const boxTypes = [
    {
      name: "Boks Akrilik Premium",
      description: "Boks seserahan kristal akrilik elegan dengan alas kayu jati belanda berukir estetis",
      totalQuota: 10,
    },
    {
      name: "Boks Kayu Rustic",
      description: "Boks seserahan kayu solid natural bernuansa rustic vintage dengan aksen floral kering",
      totalQuota: 10,
    },
    {
      name: "Boks Velvet Hexagon",
      description: "Boks seserahan hexagonal beludru mewah berornamen keemasan",
      totalQuota: 10,
    },
  ];

  for (const box of boxTypes) {
    const upsertedBox = await prisma.boxType.upsert({
      where: { name: box.name },
      update: {
        description: box.description,
        totalQuota: box.totalQuota,
      },
      create: {
        name: box.name,
        description: box.description,
        totalQuota: box.totalQuota,
      },
    });
    console.log(`✅ BoxType '${upsertedBox.name}' siap (Kuota: ${upsertedBox.totalQuota})`);
  }

  // 2. Seed 1 Akun ADMIN dari environment variables
  const adminEmail = process.env.ADMIN_EMAIL || "admin@shahproject.com";
  const rawAdminPassword = process.env.ADMIN_PASSWORD || "AdminShah2026!";
  const adminWhatsapp = process.env.ADMIN_WHATSAPP || "6281234567890";
  const adminFullName = process.env.ADMIN_NAME || "Administrator Shah Project";

  const passwordHash = await bcrypt.hash(rawAdminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase().trim() },
    update: {
      fullName: adminFullName,
      whatsapp: adminWhatsapp,
      role: Role.ADMIN,
      passwordHash,
    },
    create: {
      email: adminEmail.toLowerCase().trim(),
      fullName: adminFullName,
      whatsapp: adminWhatsapp,
      role: Role.ADMIN,
      passwordHash,
    },
  });

  console.log(`✅ Akun ADMIN siap: ${admin.email} (Role: ${admin.role})`);
  console.log("🎉 Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
