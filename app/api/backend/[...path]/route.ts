import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const backendBaseUrl =
  process.env.BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTPUBLICBASEURL ||
  "http://localhost:5006/api/v1";

const requestTimeoutMs = 15_000;
const publicBackendPaths = new Set([
  "auth/forget",
  "auth/verify-otp",
  "auth/reset-password",
]);

const requestHeaderAllowlist = ["accept", "accept-language", "content-type", "user-agent"];
const blockedResponseHeaders = [
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "set-cookie",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function createTargetUrl(path: string[], request: NextRequest) {
  if (!path.length || path.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Invalid backend path");
  }

  const backendRoot = new URL(backendBaseUrl);
  if (!["http:", "https:"].includes(backendRoot.protocol)) {
    throw new Error("Invalid backend protocol");
  }

  backendRoot.search = "";
  backendRoot.hash = "";
  backendRoot.pathname = `${backendRoot.pathname.replace(/\/+$/, "")}/`;

  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const targetUrl = new URL(encodedPath, backendRoot);

  if (
    targetUrl.origin !== backendRoot.origin ||
    !targetUrl.pathname.startsWith(backendRoot.pathname)
  ) {
    throw new Error("Backend target escaped its configured root");
  }

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  return targetUrl;
}

async function getBackendBearer(request: NextRequest) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  const cookieRequest = new NextRequest(request.url, {
    headers: { cookie },
  });
  try {
    const token = await getToken({
      req: cookieRequest,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (
      !token ||
      token.error ||
      token.role !== "admin" ||
      !token.accessToken ||
      !token.accessTokenExpires ||
      Date.now() >= token.accessTokenExpires
    ) {
      return null;
    }

    return token.accessToken;
  } catch {
    return null;
  }
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const backendPath = path.join("/");
  const isPublicPath = request.method === "POST" && publicBackendPaths.has(backendPath);

  if (isPublicPath && !request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json(
      { success: false, message: "JSON request body required" },
      { status: 415 },
    );
  }

  let targetUrl: URL;
  try {
    targetUrl = createTargetUrl(path, request);
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid backend request" },
      { status: 400 },
    );
  }

  const bearer = isPublicPath ? null : await getBackendBearer(request);
  if (!isPublicPath && !bearer) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  const headers = new Headers();
  requestHeaderAllowlist.forEach((name) => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });
  if (bearer) headers.set("authorization", `Bearer ${bearer}`);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        success: false,
        message: timedOut ? "Backend request timed out" : "Backend service is unavailable",
      },
      { status: timedOut ? 504 : 502 },
    );
  }

  const responseHeaders = new Headers(response.headers);
  blockedResponseHeaders.forEach((name) => responseHeaders.delete(name));

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
