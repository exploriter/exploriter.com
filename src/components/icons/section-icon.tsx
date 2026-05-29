import { VectorThreeIcon } from "@phosphor-icons/react/dist/ssr/VectorThree";
import { ShareNetworkIcon } from "@phosphor-icons/react/dist/ssr/ShareNetwork";
import { CircleIcon } from "@phosphor-icons/react/dist/ssr/Circle";
import { PlusSquareIcon } from "@phosphor-icons/react/dist/ssr/PlusSquare";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import { BoundingBoxIcon } from "@phosphor-icons/react/dist/ssr/BoundingBox";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise";
import { FlowerLotusIcon } from "@phosphor-icons/react/dist/ssr/FlowerLotus";
import { TriangleIcon } from "@phosphor-icons/react/dist/ssr/Triangle";
import { LadderSimpleIcon } from "@phosphor-icons/react/dist/ssr/LadderSimple";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/css";
import type { Icon } from "@phosphor-icons/react";
import type { ConceptKind } from "@/lib/exp3";

type SectionIconProps = {
   slug: string;
   label: string;
};

type TooltippedIconProps = {
   icon: Icon;
   label: string;
   className?: string;
};

type IconConfig = {
   icon: Icon;
   label: string;
};

const iconClassName = "size-6.5 shrink-0 hover:text-emerald-500 transition-colors duration-300 hover:cursor-help";
const iconGroupClassName = "flex items-center gap-px text-mist-500 group-hover:text-emerald-600 transition-colors duration-250";

function TooltippedIcon({ icon: Icon, label, className }: TooltippedIconProps) {
   return (
      <Tooltip>
         <TooltipTrigger render={<span />}>
            <Icon weight="light" className={cn(iconClassName, className)} />
         </TooltipTrigger>
         <TooltipContent>{label}</TooltipContent>
      </Tooltip>
   );
}

export default function SectionIcon({ slug, label }: SectionIconProps) {
   if (slug === "concepts") {
      return <IconGroup icons={Object.values(conceptIconMap)} />;
   }

   const Icon = sectionIconMap[slug];

   if (!Icon) {
      return null;
   }

   return <IconGroup icons={[{ icon: Icon, label }]} />;
}

export function ConceptKindIcon({ conceptKind }: { conceptKind: ConceptKind }) {
   const icon = conceptIconMap[conceptKind];

   return <IconGroup icons={[icon]} />;
}

function IconGroup({ icons }: { icons: IconConfig[] }) {
   return (
      <TooltipProvider>
         <span className={iconGroupClassName}>
            {icons.map((icon) => (
               <TooltippedIcon key={icon.label} icon={icon.icon} label={icon.label} />
            ))}
         </span>
      </TooltipProvider>
   );
}

const conceptIconMap = {
   INDIVIDUAL: {
      icon: CircleIcon,
      label: "Individual Concept",
   },
   COLLECTION: {
      icon: TriangleIcon,
      label: "Concept Collection",
   },
} satisfies Record<ConceptKind, IconConfig>;

const sectionIconMap: Record<string, Icon> = {
   methods: BoundingBoxIcon,
   stories: VectorThreeIcon,
   playgrounds: GlobeIcon,
   projects: PlusSquareIcon,
   practices: ArrowsClockwiseIcon,
   circles: ShareNetworkIcon,
   guilds: LadderSimpleIcon,
   commons: FlowerLotusIcon,
};
