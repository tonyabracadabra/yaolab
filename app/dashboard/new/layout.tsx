import type { Metadata } from "next";
import { Inter, Urbanist } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const urbanist = Urbanist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YaoLab@JNU",
  description: "Discovering the unknowns",
};

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <main>{children}</main>
    </div>
  );
}
