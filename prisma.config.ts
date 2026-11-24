import "dotenv/config";

const config = {
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
};

export default config;