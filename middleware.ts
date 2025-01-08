import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { locales } from "./config";

const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: "en",
  localePrefix: "always",
});

export default authMiddleware({
  beforeAuth: (req) => {
    return intlMiddleware(req);
  },
  publicRoutes: ["/:locale", "/:locale/sign-in", "/:locale/aboutus"],
  afterAuth(auth, req) {
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: "/sign-in" });
    }

    const pathParts = req.nextUrl.pathname.split("/").filter(Boolean);
    if (pathParts.length == 2 && pathParts[1] === "workspace") {
      const newUrl = `/${pathParts[0]}/workspace/new`;
      return NextResponse.rewrite(new URL(newUrl, req.url));
    }
  },
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
