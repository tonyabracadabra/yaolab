import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["en", "zh"],
  defaultLocale: "en",
});

export default authMiddleware({
  beforeAuth: (req) => {
    // Execute next-intl middleware before Clerk's auth middleware
    // @ts-ignore
    return intlMiddleware(req);
  },
  // Ensure that locale specific sign-in pages are public
  publicRoutes: ["/:locale", "/:locale/sign-in"],
  afterAuth(auth, req) {
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: "/sign-in" });
    }

    // Extract the locale and path from the requested URL
    const pathParts = req.nextUrl.pathname.split("/").filter(Boolean);
    if (pathParts.length == 2 && pathParts[1] === "workspace") {
      // Construct new URL with locale and new path
      const newUrl = `/${pathParts[0]}/workspace/new`;
      return NextResponse.rewrite(new URL(newUrl, req.url));
    }
  },
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(en|zh)/:path*",
    "/",
    "/(api|trpc)(.*)",
  ],
};
