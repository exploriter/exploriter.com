import { CaretUpDownIcon } from "@phosphor-icons/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type BreadcrumbSectionSelectOption = {
   label: string;
   href: string;
};

type BreadcrumbSectionSelectProps = {
   label?: string;
   options: BreadcrumbSectionSelectOption[];
   value: string;
};

export default function BreadcrumbSectionSelect({ label = "Select section", options, value }: BreadcrumbSectionSelectProps) {
   return (
      <Select
         items={options.map((option) => ({ label: option.label, value: option.href }))}
         value={value}
         onValueChange={(nextValue) => {
            if (!nextValue || nextValue === window.location.pathname) return;
            window.location.href = nextValue;
         }}
      >
         <SelectTrigger
            aria-label={label}
            className="-ml-2 h-8 gap-1 border-0 px-2 py-0 font-mono text-xs uppercase text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground focus-visible:ring-ring/50"
            icon={<CaretUpDownIcon className="pointer-events-none size-3.5 opacity-45" />}
         >
            <SelectValue />
         </SelectTrigger>
         <SelectContent align="start" alignItemWithTrigger={false} className="font-mono">
            {options.map((option) => (
               <SelectItem key={option.href} value={option.href} label={option.label} className="normal-case">
                  {option.label}
               </SelectItem>
            ))}
         </SelectContent>
      </Select>
   );
}
