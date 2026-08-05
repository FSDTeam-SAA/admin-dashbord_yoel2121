import NextAuth, { type NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { getApiMessage, loginAdmin } from "@/lib/api";

const backendBaseUrl =
  process.env.BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTPUBLICBASEURL ||
  "http://localhost:5006/api/v1";

const requestTimeoutMs = 10_000;
const refreshBufferMs = 10 * 60_000;

type BackendAccessClaims = {
  exp?: number;
  role?: string;
  _id?: string;
};

type RefreshResponse = {
  success: boolean;
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

function readBackendAccessClaims(accessToken: string): BackendAccessClaims {
  const payload = accessToken.split(".")[1];
  if (!payload) throw new Error("Invalid backend access token");

  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as BackendAccessClaims;
  if (!Number.isFinite(claims.exp)) throw new Error("Backend access token has no expiry");
  return claims;
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const response = await fetch(`${backendBaseUrl.replace(/\/+$/, "")}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    const payload = (await response.json()) as RefreshResponse;
    const accessToken = payload.data?.accessToken;
    const refreshToken = payload.data?.refreshToken;

    if (!response.ok || !payload.success || !accessToken || !refreshToken) {
      throw new Error(payload.message || "Unable to refresh the session");
    }

    const claims = readBackendAccessClaims(accessToken);
    if (claims.role !== "admin") throw new Error("Admin access has been revoked");

    return {
      ...token,
      accessToken,
      refreshToken,
      accessTokenExpires: claims.exp! * 1_000,
      role: "admin",
      _id: claims._id || token._id,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        let response;
        try {
          response = await loginAdmin({
            email: credentials.email,
            password: credentials.password,
          });
        } catch (error) {
          throw new Error(getApiMessage(error));
        }

        if (!response.success) throw new Error(response.message || "Login failed");
        if (response.data.role !== "admin") throw new Error("Only admin accounts can access this dashboard");

        const accessClaims = readBackendAccessClaims(response.data.accessToken);
        if (accessClaims.role !== "admin") {
          throw new Error("Only admin accounts can access this dashboard");
        }

        const accessTokenExpires = accessClaims.exp! * 1_000;
        const backendUser = response.data.user;
        const safeUser = {
          id: response.data._id,
          _id: response.data._id,
          email: backendUser.email,
          name: backendUser.name || "Admin",
          role: "admin" as const,
          ...(backendUser.profileImage?.url
            ? { profileImage: { url: backendUser.profileImage.url } }
            : {}),
        };

        return {
          id: response.data._id,
          email: safeUser.email,
          name: safeUser.name,
          image: safeUser.profileImage?.url || null,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          accessTokenExpires,
          role: "admin",
          _id: response.data._id,
          user: safeUser,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      try {
        const redirectUrl = new URL(url);
        const appUrl = new URL(baseUrl);

        if (redirectUrl.origin === appUrl.origin) return url;
      } catch {
        return `${baseUrl}/dashboard`;
      }

      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.role = user.role;
        token._id = user._id;
        token.user = user.user;
        token.error = undefined;
        return token;
      }

      if (
        token.accessToken &&
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - refreshBufferMs
      ) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.role = token.role;
      session._id = token._id;
      session.user = token.user;
      session.accessTokenExpires = token.accessTokenExpires;
      session.error = token.error;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (!token?.accessToken) return;

      try {
        await fetch(`${backendBaseUrl.replace(/\/+$/, "")}/auth/logout`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token.accessToken}`,
          },
          cache: "no-store",
          signal: AbortSignal.timeout(requestTimeoutMs),
        });
      } catch {
        // The local session must still be cleared if backend revocation is unavailable.
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
