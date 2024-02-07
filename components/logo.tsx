import labLightAnimation from "@/public/animations/lab-black.json";
import labDarkAnimation from "@/public/animations/lab.json";

import Lottie from "lottie-react";
import { useTheme } from "next-themes";

export function Logo() {
  const { theme } = useTheme();

  return (
    <div className="w-[50px]">
      <Lottie
        animationData={theme === "dark" ? labDarkAnimation : labLightAnimation}
      />
    </div>
  );
}
