"use client";

import { MagicContainer } from "@/components/magicui/magic-card";
import ShimmerButton from "@/components/magicui/shimmer-button";
import Preprocess from "@/components/preprocess";

export default function Analysis() {
  return (
    <main className="h-full flex items-start justify-center w-full font-sans">
      <div className="flex items-center flex-col w-full h-full">
        <MagicContainer className="py-12 hide-links h-[70vh] px-24 flex gap-8 items-center justify-around">
          {/* <MagicCard className="h-full flex items-center justify-center"> */}
          <Preprocess />
          {/* </MagicCard> */}
        </MagicContainer>
        <ShimmerButton>Start the analysis</ShimmerButton>
      </div>
    </main>
  );
}
