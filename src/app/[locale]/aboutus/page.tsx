"use client";

import { cn } from "@/lib/utils";
import DotPattern from "@/src/components/magicui/dot-pattern";
import { MagicCard, MagicContainer } from "@/src/components/magicui/magic-card";
import { CardDescription } from "@/src/components/ui/card";
import Image from "next/image";

const people = [
  {
    name: "XinSheng Yao",
    desc: "Ph.D., Academician of the Chinese Academy of Engineering, Professor, Doctoral Supervisor",
    pic: "/photos/姚新生.png",
  },
  {
    name: "ZhiHong Yao",
    desc: "Ph.D., Professor, Doctoral Supervisor",
    pic: "/photos/姚志红.png",
  },
  {
    name: "Yi Dai",
    desc: "Ph.D., Professor, Soctoral Supervisor",
    pic: "/photos/戴毅.png",
  },
  {
    name: "Yang Yu",
    desc: "Ph.D., Professor, Doctoral Supervisor",
    pic: "/photos/于洋.png",
  },
  {
    name: "LianglLiang He",
    desc: "Ph.D., Associate Professor, Master's Supervisor",
    pic: "/photos/何亮亮.png",
  },
  {
    name: "Pei Lin",
    desc: "Ph.D.",
    pic: "/photos/林培.png",
  },
  {
    name: "Qi Wang",
    desc: "Ph.D., Postdoctoral",
    pic: "/photos/王奇.png",
  },
  {
    name: "HaoDong Zhu",
    desc: "Ph.D. Candidate",
    pic: "/photos/朱浩东.png",
  },
  {
    name: "GuoTao Chen",
    desc: "Ph.D. Candidate",
    pic: "/photos/陈国滔.png",
  },
  {
    name: "QiQi Wang",
    desc: "Ph.D. Candidate",
    pic: "/photos/王琦琦.png",
  },
  {
    name: "ChanJuan Chen",
    desc: "Ph.D. Candidate",
    pic: "/photos/陈婵娟.png",
  },
  {
    name: "ZhiHao Zhang",
    desc: "Ph.D. Candidate",
    pic: "/photos/张志豪.png",
  },
  {
    name: "XinYa Zhang",
    desc: "Ph.D. Candidate",
    pic: "/photos/张欣亚.png",
  },
];

export default function Aboutus() {
  return (
    <main className="px-8 sm:px-16 xl:px-32 font-sans gap-2 flex flex-col">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-background p-20 py-12 md:shadow-2xl">
        <p className="z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter text-black dark:text-white">
          Our Team
        </p>
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className={cn(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)] "
          )}
        />
      </div>
      <MagicContainer className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {people.map((person, index) => (
          <MagicCard key={index} className="flex flex-col items-start gap-4">
            <Image
              width={310}
              height={310}
              src={person.pic}
              alt={person.name}
              className="rounded-lg object-cover h-[310px] w-[310px]"
            />
            <div className="flex flex-col items-start justify-between h-full mt-2 gap-2">
              <h2 className="text-2xl font-bold">{person.name}</h2>
              <div className="flex items-center justify-center h-full">
                <CardDescription className="text-xs">
                  {person.desc}
                </CardDescription>
              </div>
            </div>
          </MagicCard>
        ))}
      </MagicContainer>
    </main>
  );
}
