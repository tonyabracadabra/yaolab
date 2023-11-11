import labAnimation from "@/public/animations/lab.json";
import Lottie from "lottie-react";

export function Logo() {
  return (
    <div className="w-[50px]">
      <Lottie animationData={labAnimation} />
    </div>
  );
}
