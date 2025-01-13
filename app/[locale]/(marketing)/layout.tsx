import { SiteHeader } from "@/components/site-header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "YaoLab Metabolites Analysis",
  description:
    "Advanced metabolomics analysis platform for processing and visualizing metabolite networks with automated workflow",
  keywords: [
    "metabolomics",
    "network analysis",
    "data visualization",
    "workflow automation",
  ],
  openGraph: {
    title: "YaoLab Metabolites Analysis",
    description:
      "Advanced metabolomics analysis platform for processing and visualizing metabolite networks with automated workflow",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
