import "next-auth";
import "next-auth/jwt";

type SessionAdminUser = {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: "admin";
  profileImage?: {
    url?: string;
  };
};

type SessionRefreshError = "RefreshAccessTokenError";

declare module "next-auth" {
  interface Session {
    role?: "admin";
    _id?: string;
    user?: SessionAdminUser;
    accessTokenExpires?: number;
    error?: SessionRefreshError;
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    role?: "admin";
    _id?: string;
    user?: SessionAdminUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    role?: "admin";
    _id?: string;
    user?: SessionAdminUser;
    error?: SessionRefreshError;
  }
}
