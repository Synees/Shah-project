import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      whatsapp?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    whatsapp?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    whatsapp?: string | null;
  }
}
