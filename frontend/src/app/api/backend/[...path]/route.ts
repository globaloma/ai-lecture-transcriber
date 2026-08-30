import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Render's free tier can take 30-60s to wake up from a cold start; without
// this the platform's default function timeout can cut the proxy off before
// the backend responds, even though the backend request completes anyway.
export const maxDuration = 60;

const BACKEND_URL = process.env.BACKEND_URL;

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Fail with a message instead of an opaque empty 500 — every request
  // through this proxy silently crashed here whenever BACKEND_URL wasn't
  // set in Vercel's own env vars (a local .env value never reaches Vercel).
  if (!BACKEND_URL) {
    console.error("BACKEND_URL is not set in the deployment environment");
    return new Response(
      JSON.stringify({ error: "Backend proxy misconfigured: BACKEND_URL is not set" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { path } = await params;

  const url = new URL(`${BACKEND_URL}/${path.join("/")}`);
  url.search = req.nextUrl.search;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("ngrok-skip-browser-warning", "true");

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = req.body;
    init.duplex = "half";
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    console.error("Proxy fetch to backend failed:", err);
    return new Response(
      JSON.stringify({ error: "Could not reach backend", details: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("content-length");

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;