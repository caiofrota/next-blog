import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/blog-engine/services/auth";

export async function POST(request: NextRequest) {
  await logout();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
