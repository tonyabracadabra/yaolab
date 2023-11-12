"use client";

import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import Globe from "@/components/magicui/globe";
import Marquee from "@/components/magicui/marquee";
import { SiteHeader } from "@/components/site-header";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import graphAnimation from "@/public/animations/graph.json";
import lineAnimation from "@/public/animations/line.json";

import Lottie from "lottie-react";

import { FileTextIcon, GlobeIcon, InputIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { ContactIcon } from "lucide-react";

const features = [
  {
    Icon: FileTextIcon,
    name: "Upload your files",
    description: "We automatically save your files as you type.",
    href: "/",
    className: "col-span-3 lg:col-span-1",
    background: (
      <Marquee
        pauseOnHover
        className="absolute top-10 [--duration:20s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] "
      >
        {[
          <div
            key={0}
            className={cn(
              "relative w-32 cursor-pointer overflow-hidden rounded-xl border",
              "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
              "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
              "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none"
            )}
          >
            <Lottie animationData={lineAnimation} />
          </div>,
          <div
            key={1}
            className={cn(
              "relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4",
              "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
              "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
              "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none"
            )}
          >
            <Lottie animationData={graphAnimation} />
          </div>,
          <div
            key={2}
            className={cn(
              "relative w-32 cursor-pointer overflow-hidden rounded-xl border",
              "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
              "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
              "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none"
            )}
          >
            <Lottie animationData={lineAnimation} />
          </div>,
          <div
            key={3}
            className={cn(
              "relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4",
              "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
              "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
              "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none"
            )}
          >
            <Lottie animationData={graphAnimation} />
          </div>,
        ]}
      </Marquee>
    ),
  },
  {
    Icon: InputIcon,
    name: "Find community driven research",
    description:
      "Search for analysis and research on traditional Chinese medicine",
    href: "/",
    className: "col-span-3 lg:col-span-2",
    background: (
      <Command className="absolute right-10 top-10 w-[70%] origin-top translate-x-0 border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:-translate-x-10">
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>黄芪</CommandItem>
            <CommandItem>大黄</CommandItem>
            <CommandItem>白芍</CommandItem>
            <CommandItem>当归</CommandItem>
            <CommandItem>桂枝</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    ),
  },
  {
    Icon: GlobeIcon,
    name: "Join the global community",
    description:
      "Building a global research community on traditional Chinese medicine",
    href: "/",
    className: "col-span-3 lg:col-span-2",
    background: (
      <Globe className="top-0 h-[600px] w-[600px] transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_30%,#000_100%)] group-hover:scale-105 sm:left-40" />
    ),
  },
  {
    Icon: ContactIcon,
    name: "About Us",
    description: "More on our mission and team",
    className: "col-span-3 lg:col-span-1",
    href: "/",
    background: (
      <div
        style={{
          backgroundPosition: "center 40%",
        }}
        className="-z-24 absolute bg-gradient-overlay rounded-lg w-full h-full bg-cover opacity-10 bg-[url('/jnu.png')]"
      />
    ),
  },
];

export default function Home() {
  return (
    <main className="p-8 px-8 sm:px-16 xl:px-32 font-sans">
      <SiteHeader />
      <BentoGrid>
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </main>
  );
}
