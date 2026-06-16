import "next-auth";
import "next-auth/jwt";
import type { AdminUser } from "@/lib/api";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    _id?: string;
    user?: AdminUser;
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    _id?: string;
    user?: AdminUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    _id?: string;
    user?: AdminUser;
  }
}
