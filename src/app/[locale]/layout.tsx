import { SiteHeader } from "@/src/components/site-header";
import { ThemeProvider } from "@/src/components/theme-provider";
import { Toaster } from "@/src/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Inter, Urbanist } from "next/font/google";

import { NextIntlClientProvider, useMessages } from "next-intl";
import "./globals.css";
import ConvexClerkClientProvider from "./provider";

const inter = Inter({ subsets: ["latin"] });
const urbanist = Urbanist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YaoLab@JNU",
  description: "Discovering the unknowns",
};

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = useMessages();

  return (
    <ConvexClerkClientProvider>
      <html lang={locale}>
        <NextIntlClientProvider messages={messages}>
          <body
            className={`${GeistSans.variable} ${GeistMono.variable} ${inter.className} ${urbanist.className}`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SiteHeader />
              <main>{children}</main>
              <Toaster position="top-center" />
            </ThemeProvider>
            <Analytics />
          </body>
        </NextIntlClientProvider>
      </html>
    </ConvexClerkClientProvider>
  );
}
