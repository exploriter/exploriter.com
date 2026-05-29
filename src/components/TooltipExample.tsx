import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function TooltipExample() {
   return (
      <TooltipProvider>
         <Tooltip>
            <TooltipTrigger render={<span className="cursor-help" />}>Hover</TooltipTrigger>
            <TooltipContent>Add to library</TooltipContent>
         </Tooltip>
      </TooltipProvider>
   );
}
