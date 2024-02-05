import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/dashboard") &&
    !request.nextUrl.pathname.startsWith("/dashboard/analysis")
  ) {
    return NextResponse.rewrite(new URL("/dashboard/new", request.url));
  }
}

export default authMiddleware({
  publicRoutes: ["/", "/api/getAuthenticatedUserId"],
  afterAuth(auth, req) {
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: "/sign-in" });
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
