import {
   ArrowsClockwiseIcon,
   BoundingBoxIcon,
   CircleIcon,
   FlowerLotusIcon,
   GlobeIcon,
   LadderSimpleIcon,
   PlusSquareIcon,
   ShareNetworkIcon,
   TriangleIcon,
   VectorThreeIcon,
} from "@phosphor-icons/react/ssr";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/css";
import type { Icon, IconWeight } from "@phosphor-icons/react/lib";
import type { ConceptKind } from "@/lib/exp3";

type SectionIconProps = {
   slug: string;
   label: string;
   className?: string;
   weight?: IconWeight;
};

type TooltippedIconProps = {
   icon: Icon;
   label: string;
   className?: string;
   weight: IconWeight;
};

type IconConfig = {
   icon: Icon;
   label: string;
};

const iconClassName = "size-6.5 shrink-0 hover:text-emerald-500 transition-colors duration-300 hover:cursor-help";
const iconGroupClassName = "flex items-center gap-px text-mist-500 group-hover:text-emerald-600 transition-colors duration-250";

function TooltippedIcon({ icon: Icon, label, className, weight }: TooltippedIconProps) {
   return (
      <Tooltip>
         <TooltipTrigger render={<span />}>
            <Icon weight={weight} className={cn(iconClassName, className)} />
         </TooltipTrigger>
         <TooltipContent>{label}</TooltipContent>
      </Tooltip>
   );
}

type IconGroupProps = {
   icons: IconConfig[];
   className?: string;
   weight?: IconWeight;
};

type ConceptKindIconProps = {
   conceptKind: ConceptKind;
   className?: string;
   weight?: IconWeight;
};

export default function SectionIcon({ slug, label, className, weight }: SectionIconProps) {
   if (slug === "concepts") {
      return <IconGroup icons={Object.values(conceptIconMap)} className={className} weight={weight} />;
   }

   const Icon = sectionIconMap[slug];

   if (!Icon) {
      return null;
   }

   return <IconGroup icons={[{ icon: Icon, label }]} className={className} weight={weight} />;
}

export function ConceptKindIcon({ conceptKind, className, weight }: ConceptKindIconProps) {
   const icon = conceptIconMap[conceptKind];

   return <IconGroup icons={[icon]} className={className} weight={weight} />;
}

function IconGroup({ icons, className, weight = "light" }: IconGroupProps) {
   return (
      <TooltipProvider>
         <span className={iconGroupClassName}>
            {icons.map((icon) => (
               <TooltippedIcon key={icon.label} icon={icon.icon} label={icon.label} className={className} weight={weight} />
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
