import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YaoLab@JNU",
  description: "Discovering the unknowns",
};

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
