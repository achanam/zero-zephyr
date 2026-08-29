import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { baseHeaders, buildCorsHeaders } from "@/lib/zk/security";

export const dynamic = "force-dynamic";

// Deliberately NO origin check — used for uptime monitoring outside the
// browser (curl, healthcheck services), not just from z.achanam.com.
export async function GET(request: NextRequest) {
  const cors = baseHeaders(buildCorsHeaders(request.headers.get("Origin")));
  return NextResponse.json({ status: "ok", ts: Date.now() }, { status: 200, headers: cors });
}

export async function OPTIONS(request: NextRequest) {
  const cors = baseHeaders(buildCorsHeaders(request.headers.get("Origin")));
  return new NextResponse(null, { status: 204, headers: cors });
}
