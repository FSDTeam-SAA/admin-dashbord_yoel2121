import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => Boolean(token?.accessToken && token?.role === "admin"),
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/users/:path*", "/tradespeople/:path*", "/category/:path*", "/settings/:path*"],
};
