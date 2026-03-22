import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function proxy(request: Request) {
  const session = await auth();
  const { pathname } = new URL(request.url);

  // Not logged in → redirect to login
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
