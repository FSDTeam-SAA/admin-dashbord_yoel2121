import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginAdmin } from "@/lib/api";

export const authOptions: NextAuthOptions = {
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
        const response = await loginAdmin({
          email: credentials.email,
          password: credentials.password,
        });

        if (!response.success || response.data.role !== "admin") return null;

        return {
          id: response.data._id,
          email: response.data.user.email,
          name: response.data.user.name || "Admin",
          image: response.data.user.profileImage?.url || null,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          role: response.data.role,
          _id: response.data._id,
          user: response.data.user,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & {
          accessToken: string;
          refreshToken: string;
          role: string;
          _id: string;
          user: unknown;
        };
        token.accessToken = authUser.accessToken;
        token.refreshToken = authUser.refreshToken;
        token.role = authUser.role;
        token._id = authUser._id;
        token.user = authUser.user;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.role = token.role as string;
      session._id = token._id as string;
      session.user = token.user as typeof session.user;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
