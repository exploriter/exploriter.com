import { MapPinAreaIcon } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/css";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ProjectHereIconProps = {
   className?: string;
};

export default function ProjectHereIcon({ className }: ProjectHereIconProps) {
   return (
      <TooltipProvider>
         <Tooltip>
            <TooltipTrigger render={<span className={cn("flex items-center", className)} aria-label="You are here!" />}>
               <MapPinAreaIcon className="size-6 text-red-700" aria-hidden="true" weight="fill" />
            </TooltipTrigger>
            <TooltipContent>You are here!</TooltipContent>
         </Tooltip>
      </TooltipProvider>
   );
}
