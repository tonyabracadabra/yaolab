"use client";

import graphAnimation from "@/public/animations/graph.json";
import lineAnimation from "@/public/animations/line.json";
import { BentoCard, BentoGrid } from "@/src/components/magicui/bento-grid";
import Globe from "@/src/components/magicui/globe";
import Marquee from "@/src/components/magicui/marquee";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";

import Lottie from "lottie-react";

import { GlobeIcon, InputIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { BorderBeam } from "@/src/components/magicui/border-beam";
import Meteors from "@/src/components/magicui/meteors";
import TextShimmer from "@/src/components/magicui/text-shimmer";
import { Button } from "@/src/components/ui/button";
import {
  ArrowRightIcon,
  ContactIcon,
  DownloadCloud,
  GraduationCap,
  ScatterChartIcon,
} from "lucide-react";

const papers = [
  {
    title:
      "A compounds annotation strategy using targeted molecular networking for offline two-dimensional liquid chromatography-mass spectrometry analysis: Yupingfeng as a case study",
    authors:
      "Zhu Haodong, He Liangliang, Wu Wenyong, Duan Huifang, Chen Jiali, Xiao Qiang, Lin Pei, Qin Zifei, Dai Yi, Wu Wanying, Hu Liufang, Yao Zhihong",
    href: "https://pubmed.ncbi.nlm.nih.gov/37236139/",
  },
  {
    title:
      "A multi-module structure labelled molecular network orients the chemical profiles of traditional Chinese medicine prescriptions: Xiaoyao San, as an example",
    authors:
      "Liangliang He, Heng Sun, Qingmei Mo, Qiang Xiao, Kefeng Yang, Xintong Chen, Haodong Zhu, Xupeng Tong, Xinsheng Yao, Jiaxu Chen, Zhihong Yao",
    href: "https://pubmed.ncbi.nlm.nih.gov/38184988/",
  },
  {
    title:
      "Quality assessment of commercial dried ginger (Zingiber officinale Roscoe) based on targeted and non-targeted chemical profiles and anti-inflammatory activity",
    authors:
      "He Liangliang, Duan Huifang, Chen Xintong, Chen Yuanshan, Mo Qingmei, Huang Junqing, Zhao Huinan, Yao Xinsheng, Chen Jiaxu, Yao Zhihong",
    href: "https://pubmed.ncbi.nlm.nih.gov/36914321/",
  },
  {
    title:
      "Regulation of phospholipid peroxidation signaling by a traditional Chinese medicine formula for coronary heart disease",
    authors:
      "Ma Xiaohui, Wang Qi, Liu Chunyu, Liu Jianghanzi, Luo Ganqing, He Liangliang, Yuan Tianhui, He Rong-Rong, Yao Zhihong",
    href: "https://pubmed.ncbi.nlm.nih.gov/36931097/",
  },
  {
    title:
      "Pharmacokinetics integrated with network pharmacology to clarify effective components and mechanism of Wendan decoction for the intervention of coronary heart disease",
    authors:
      "Lin Pei, Hu Liufang, Huang Qiaoting, Zhang Yezi, Qin Zifei, Chen Jiaxu, Yao Xinsheng, Wu Huanlin, Yao Zhihong, Xu Danping",
    href: "https://pubmed.ncbi.nlm.nih.gov/37217155/",
  },
  {
    title:
      "A screening strategy for bioactive components of Bu-Zhong-Yi-Qi-Tang regulating spleen-qi deficiency based on endobiotics-targets-xenobiotics association network",
    authors:
      "Hu Liufang, Chen Jiali, Duan Huifang, Du Jing, Zou Zhenyu, Qiu Yuan, Chen Jiaxu, Yao Xinsheng, Kiyohara Hiroaki, Nagai Takayuki, Yao Zhihong",
    href: "https://pubmed.ncbi.nlm.nih.gov/37178982/",
  },
  {
    title:
      "Kinetic features of Gualou-Xiebai-Banxia decoction, a classical traditional Chinese medicine formula, in rat plasma and intestine content based on its metabolic profile",
    authors:
      "Lin Pei, Wang Qi, Chen Jiayun, Zhao Huinan, Huang Haimeng, Xiao Qiang, Qin Zifei, Chen Jiaxu, Yao Xinsheng, Yao Zhihong",
    href: "https://www.sciencedirect.com/science/article/pii/S187853522200733X",
  },
  {
    title:
      "Cytochrome P450 metabolism studies of [6]-gingerol,[8]-gingerol, and [10]-gingerol by liver microsomes of humans and different species combined with expressed CYP enzymes",
    authors:
      "Chen Chanjuan, Chen Xintong, Mo Qingmei, Liu Jie, Yao Xinsheng, Di Xin, Qin Zifei, He Liangliang, Yao Zhihong",
    href: "https://pubs.rsc.org/en/content/articlelanding/2023/ra/d2ra06184h",
  },
  {
    title:
      "Metabolic profile and potential mechanisms of Wendan decoction on coronary heart disease by ultra‐high‐performance quadrupole time of flight‐mass spectrometry combined with network pharmacology analysis. Journal of Separation Science, 2023, 46(1): 2200456. (IF: 3.1)",
    href: "https://pubmed.ncbi.nlm.nih.gov/36300722/",
    authors:
      "Wang, Qi1; Chen, Jiayun1; Zhang, Yezi; Xu, Danping; Wu, Huanlin; Lin, Pei*; He, Liangliang; Qin, Zifei; Yao Zhihong*",
  },
  {
    title:
      "The discovery of Q-markers of Qiliqiangxin Capsule, a traditional Chinese medicine prescription in the treatment of chronic heart failure, based on a novel strategy of multi-dimensional “radar chart” mode evaluation [J], Phytomedicine,2021, 82: 153443. (IF: 7.9)",
    href: "https://pubmed.ncbi.nlm.nih.gov/33429210/",
    authors:
      "He Liangliang1, Liu Yuehe1, Yang Kefeng, Zou Zhenyu, Fan Cailian, Yao Zhihong*, Yi Dai*, Keshen Li, Jiaxu Chen, Xinsheng Yao",
  },
  {
    title:
      "Development of a three-step-based novel strategy integrating DMPK with network pharmacology and bioactivity evaluation for the discovery of Q-markers of traditional Chinese medicine prescriptions: Danlou tablet as an example, Phytomedicine, 2023, 108: 154511. (IF: 7.9)",
    href: "https://pubmed.ncbi.nlm.nih.gov/36334388/",
    authors:
      "Wang Qi1, Chen Guotao1, Chen Xintong, Liu Yuehe, Qin Zifei, Lin Pei*, Shang Hongcai, Ye Min, He liangliang*, Yao Zhinghong*",
  },
];

const features = [
  {
    Icon: ScatterChartIcon,
    name: "Metabolic Reaction Network Analysis",
    hrefText: "Analyze Now",
    description:
      "Our latest research in streamlining metabolic network analysis from data to visualization.",
    href: "/dashboard/new",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="relative">
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
      </div>
    ),
  },
  {
    Icon: InputIcon,
    name: "Find community driven research",
    description:
      "Search for analysis and research on traditional Chinese medicine",
    href: "/",
    hrefText: "Stay Tuned",
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
    href: "/analysis",
    hrefText: "Stay Tuned",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div className="relative">
        <Meteors number={20} />
        <Globe className="top-0 h-[600px] w-[600px] transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_30%,#000_100%)] group-hover:scale-105 sm:left-40" />
      </div>
    ),
  },
  {
    Icon: ContactIcon,
    name: "About Us",
    description: "More on our mission and team",
    className: "col-span-3 lg:col-span-1",
    href: "/aboutus",
    hrefText: "Learn More",
    background: (
      <div
        style={{
          backgroundPosition: "center 40%",
        }}
        className="-z-24 absolute bg-gradient-overlay rounded-lg w-full h-full bg-cover opacity-20 bg-[url('/jnu.png')]"
      />
    ),
  },
  {
    Icon: GraduationCap,
    name: "Research",
    description: "Our latest research and publications",
    href: "research",
    hrefText: "Stay Tuned",
    className: "col-span-1 lg:col-span-3",
    background: (
      <Marquee
        pauseOnHover
        className="absolute top-6 [--duration:120s] [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] flex items-start justify-start"
      >
        {papers.map((paper, index) => (
          <a
            key={index}
            className={cn(
              "inline-block mr-4 cursor-pointer overflow-hidden rounded-xl border p-4",
              "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
              "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
              "transition-all duration-300 ease-out text-sm w-[250px]"
            )}
            href={paper.href}
            target="_blank"
          >
            {paper.title}
          </a>
        ))}
      </Marquee>
    ),
  },
];

export default function Home() {
  return (
    <div className="p-8 px-8 h-full w-full sm:px-16 xl:px-32 font-sans">
      <BentoGrid className="relative">
        <div
          className="z-10 flex items-start w-full justify-start pb-4 absolute left-6 top-6"
          onClick={() => {
            // Find the element with the demo-section class name
            const demoSection = document.querySelector(".demo");

            if (demoSection) {
              // Scroll to the demo section with smooth scrolling
              demoSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <div
            className={cn(
              "group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            )}
          >
            <TextShimmer className="inline-flex items-center justify-center px-4 py-1 text-sm">
              <span>✨ See Demo</span>
              <ArrowRightIcon className="w-4 h-4 ml-1 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </TextShimmer>
          </div>
        </div>
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
      <div className="demo relative w-full mt-4 p-2 rounded-lg flex items-center justify-center flex-col h-[85vh]">
        <Button
          onClick={() => {
            // download a zip of two files in folder /public/demo.zip
            const a = document.createElement("a");
            a.href = "/demo.zip";
            a.download = "demo.zip";
            a.click();
          }}
          size="sm"
          variant="outline"
          className="absolute right-4 top-4 z-[30000]"
        >
          <DownloadCloud className="w-4 h-4 mr-3 my-4" />
          Download Demo Data
        </Button>
        <iframe
          src="https://demo.arcade.software/wPDjQJyqvgEjdLCS8cUC?embed&show_copy_link=true"
          title="YaoLab@JNU"
          loading="lazy"
          allowFullScreen
          allow="clipboard-write"
          className="w-full h-full z-[20000]"
          style={{
            colorScheme: "light",
          }}
        ></iframe>
        <BorderBeam size={250} duration={12} delay={9} />
      </div>
    </div>
  );
}
