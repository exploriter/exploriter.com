import type { ReactNode } from "react";
import { cn } from "@/lib/css";

type CalloutProps = {
   children: ReactNode;
   title?: string;
   className?: string;
};

type CalloutGridProps = {
   children: ReactNode;
   className?: string;
};

export function Callout({ children, title, className }: CalloutProps) {
   return (
      <aside className={cn("border border-dashed bg-muted/50 px-5 py-4 pt-6 rounded my-12 relative", className)}>
         {title ? (
            <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground bg-white rounded px-2 py-1 border border-dashed absolute -top-3.5 left-3">
               <span dangerouslySetInnerHTML={{ __html: title }} />
            </h3>
         ) : null}
         <div className="text-base leading-6.5 text-foreground [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{children}</div>
      </aside>
   );
}

export function CalloutGrid({ children, className }: CalloutGridProps) {
   return <div className={cn("grid gap-12 md:gap-6 mt-16 mb-12 md:grid-cols-2 [&>aside]:my-0", className)}>{children}</div>;
}
