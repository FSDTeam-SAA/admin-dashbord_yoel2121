import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) =>
      Boolean(
        token?.accessToken &&
          token?.refreshToken &&
          token?.role === "admin" &&
          !token?.error,
      ),
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/tradespeople/:path*",
    "/category/:path*",
    "/carousels/:path*",
    "/terms-of-service/:path*",
    "/privacy-policy/:path*",
    "/settings/:path*",
  ],
};
