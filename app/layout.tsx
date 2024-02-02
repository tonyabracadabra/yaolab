import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Inter, Urbanist } from "next/font/google";

import "./globals.css";
import ConvexClerkClientProvider from "./provider";

const inter = Inter({ subsets: ["latin"] });
const urbanist = Urbanist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YaoLab@JNU",
  description: "Discovering the unknowns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexClerkClientProvider>
      <html lang="en">
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
        </body>
      </html>
    </ConvexClerkClientProvider>
  );
}
