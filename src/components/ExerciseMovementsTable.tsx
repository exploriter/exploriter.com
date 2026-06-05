import * as React from "react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { CaretDownIcon, CaretUpDownIcon, CaretUpIcon, FunnelSimpleIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/css";
import type { ExerciseMovementSummary, ExerciseTaxonomyItem } from "@/lib/exp3";

type ExerciseMovementsTableProps = {
   movements: ExerciseMovementSummary[];
};

type FilterKey = "roles" | "patterns" | "muscleGroups" | "implements" | "adaptations" | "spatialOrientations" | "contractionTypes" | "lateralPlanes";

type FilterOption = {
   id: string;
   name: string;
   description?: string;
};

type FilterConfig = {
   key: FilterKey;
   label: string;
   getItems: (movement: ExerciseMovementSummary) => FilterOption[];
   tooltips: boolean;
};

type ExerciseMovementTableRow = ExerciseMovementSummary & {
   searchScore: number;
};

const filterConfigs = [
   {
      key: "roles",
      label: "Roles",
      getItems: (movement) => movement.roles.map((role) => ({ id: role, name: formatRoleLabel(role) })),
      tooltips: false,
   },
   {
      key: "patterns",
      label: "Patterns",
      getItems: (movement) => movement.patterns,
      tooltips: true,
   },
   {
      key: "muscleGroups",
      label: "Muscle Groups",
      getItems: (movement) => movement.muscleGroups,
      tooltips: true,
   },
   {
      key: "implements",
      label: "Implements",
      getItems: (movement) => movement.implements,
      tooltips: true,
   },
   {
      key: "adaptations",
      label: "Adaptations",
      getItems: (movement) => movement.adaptations,
      tooltips: true,
   },
   {
      key: "spatialOrientations",
      label: "Spacial Orientations",
      getItems: (movement) => movement.spatialOrientations,
      tooltips: true,
   },
   {
      key: "contractionTypes",
      label: "Contraction Types",
      getItems: (movement) => movement.contractionTypes,
      tooltips: true,
   },
   {
      key: "lateralPlanes",
      label: "Lateral Planes",
      getItems: (movement) => movement.lateralPlanes,
      tooltips: true,
   },
] satisfies FilterConfig[];

const emptyFilters = filterConfigs.reduce(
   (filters, config) => ({
      ...filters,
      [config.key]: [],
   }),
   {} as Record<FilterKey, string[]>
);

const formatRoleLabel = (role: string) =>
   role
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

const getSearchScore = (movement: ExerciseMovementSummary, query: string) => {
   if (!query) return 0;

   const name = movement.name.toLowerCase();
   const description = movement.description.toLowerCase();
   let score = 0;

   if (name === query) score += 120;
   if (name.startsWith(query)) score += 80;
   if (name.includes(query)) score += 40;
   if (description.includes(query)) score += 6;

   return score;
};

const getUniqueOptions = (movements: ExerciseMovementSummary[], config: FilterConfig) => {
   const options = new Map<string, FilterOption>();

   for (const movement of movements) {
      for (const item of config.getItems(movement)) {
         if (!options.has(item.id)) options.set(item.id, item);
      }
   }

   return [...options.values()].sort((optionA, optionB) => optionA.name.localeCompare(optionB.name));
};

const hasAnySelectedItem = (items: FilterOption[], selectedIds: string[]) => {
   if (selectedIds.length === 0) return true;

   const itemIds = new Set(items.map((item) => item.id));
   return selectedIds.some((selectedId) => itemIds.has(selectedId));
};

const getActiveFilterCount = (selectedFilters: Record<FilterKey, string[]>) => {
   return Object.values(selectedFilters).reduce((count, selectedIds) => count + selectedIds.length, 0);
};

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
   if (direction === "asc") return <CaretUpIcon className="size-3.5" />;
   if (direction === "desc") return <CaretDownIcon className="size-3.5" />;
   return <CaretUpDownIcon className="size-3.5 opacity-45" />;
}

function SortHeader({ label, onClick, sortDirection }: { label: string; onClick: () => void; sortDirection: false | "asc" | "desc" }) {
   return (
      <button
         aria-label={`Sort by ${label.toLowerCase()}`}
         className="inline-flex h-8 items-center gap-1 rounded-sm font-mono text-xs uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
         onClick={onClick}
         type="button"
      >
         {label}
         <SortIcon direction={sortDirection} />
      </button>
   );
}

const getAriaSort = (direction: false | "asc" | "desc") => {
   if (direction === "asc") return "ascending";
   if (direction === "desc") return "descending";
   return undefined;
};

function TaxonomyBadge({ item }: { item: ExerciseTaxonomyItem }) {
   return (
      <Tooltip>
         <TooltipTrigger render={<span />}>
            <Badge
               className="cursor-help border-border/80 bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
               variant="outline"
            >
               {item.name}
            </Badge>
         </TooltipTrigger>
         <TooltipContent className="max-w-80">
            <span className="flex flex-col gap-0.5">
               <span className="font-medium">{item.name}</span>
               <span className="text-xs opacity-85">{item.description || "No description yet."}</span>
            </span>
         </TooltipContent>
      </Tooltip>
   );
}

function RoleBadge({ role }: { role: string }) {
   return (
      <Badge className="border-dashed border-border/80 bg-muted/35 text-muted-foreground" variant="outline">
         {formatRoleLabel(role)}
      </Badge>
   );
}

function FilterChip({
   config,
   isSelected,
   option,
   onToggle,
}: {
   config: FilterConfig;
   isSelected: boolean;
   option: FilterOption;
   onToggle: () => void;
}) {
   const chip = (
      <Button
         aria-pressed={isSelected}
         className={cn(
            "",
            isSelected
               ? "border-emerald-500/35 bg-emerald-500/12 hover:bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
               : "text-muted-foreground hover:border-foreground/30"
         )}
         onClick={onToggle}
         size="xs"
         type="button"
         variant="outline"
      >
         {option.name}
      </Button>
   );

   if (!config.tooltips) return chip;

   return (
      <Tooltip>
         <TooltipTrigger render={<span />}>{chip}</TooltipTrigger>
         <TooltipContent className="max-w-80">
            <span className="flex flex-col gap-0.5">
               <span className="font-medium">{option.name}</span>
               <span className="text-xs opacity-85">{option.description || "No description yet."}</span>
            </span>
         </TooltipContent>
      </Tooltip>
   );
}

function MovementClassifications({ movement }: { movement: ExerciseMovementSummary }) {
   const taxonomyItems = [
      ...movement.patterns,
      ...movement.muscleGroups,
      ...movement.implements,
      ...movement.adaptations,
      ...movement.spatialOrientations,
      ...movement.contractionTypes,
      ...movement.lateralPlanes,
   ];

   return (
      <div className="flex max-w-150 flex-wrap gap-1.5">
         {movement.roles.map((role) => (
            <RoleBadge key={role} role={role} />
         ))}
         {taxonomyItems.map((item) => (
            <TaxonomyBadge item={item} key={item.id} />
         ))}
      </div>
   );
}

function FilterPanel({
   activeFilterCount,
   filterOptions,
   selectedFilters,
   onClear,
   onToggle,
}: {
   activeFilterCount: number;
   filterOptions: Record<FilterKey, FilterOption[]>;
   selectedFilters: Record<FilterKey, string[]>;
   onClear: () => void;
   onToggle: (key: FilterKey, optionId: string) => void;
}) {
   return (
      <div className="flex max-h-[min(70vh,42rem)] flex-col gap-4 overflow-y-auto pr-1">
         <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <div>
               <div className="font-mono text-xs uppercase text-muted-foreground">Filters</div>
               <div className="text-sm text-muted-foreground">{activeFilterCount > 0 ? `${activeFilterCount} active` : "No active filters"}</div>
            </div>
            {activeFilterCount > 0 ? (
               <button
                  className="font-mono text-xs uppercase text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={onClear}
                  type="button"
               >
                  Clear
               </button>
            ) : null}
         </div>

         <div className="columns-1 gap-5 md:columns-2">
            {filterConfigs.map((config) => (
               <div className="mb-4 min-w-0 break-inside-avoid" key={config.key}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                     <div className="font-mono text-xs uppercase text-muted-foreground font-semibold">{config.label}</div>
                     {selectedFilters[config.key].length > 0 ? (
                        <span className="font-mono text-[0.7rem] uppercase text-emerald-700 dark:text-emerald-300">
                           {selectedFilters[config.key].length}
                        </span>
                     ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                     {filterOptions[config.key].map((option) => (
                        <FilterChip
                           config={config}
                           isSelected={selectedFilters[config.key].includes(option.id)}
                           key={option.id}
                           onToggle={() => onToggle(config.key, option.id)}
                           option={option}
                        />
                     ))}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}

export default function ExerciseMovementsTable({ movements }: ExerciseMovementsTableProps) {
   const [query, setQuery] = React.useState("");
   const [sorting, setSorting] = React.useState<SortingState>([{ id: "name", desc: false }]);
   const [selectedFilters, setSelectedFilters] = React.useState<Record<FilterKey, string[]>>(emptyFilters);
   const normalizedQuery = query.trim().toLowerCase();
   const activeFilterCount = getActiveFilterCount(selectedFilters);
   const effectiveSorting = React.useMemo<SortingState>(
      () => (normalizedQuery ? [{ id: "searchScore", desc: true }, ...sorting] : sorting),
      [normalizedQuery, sorting]
   );

   const filterOptions = React.useMemo(() => {
      return filterConfigs.reduce(
         (optionsByKey, config) => ({
            ...optionsByKey,
            [config.key]: getUniqueOptions(movements, config),
         }),
         {} as Record<FilterKey, FilterOption[]>
      );
   }, [movements]);

   const toggleNameSort = React.useCallback(() => {
      setSorting((currentSorting) => {
         const nameSort = currentSorting.find((sort) => sort.id === "name");
         return [{ id: "name", desc: nameSort ? !nameSort.desc : false }];
      });
   }, []);

   const toggleFilter = React.useCallback((key: FilterKey, optionId: string) => {
      setSelectedFilters((currentFilters) => {
         const selectedIds = currentFilters[key];
         const nextSelectedIds = selectedIds.includes(optionId)
            ? selectedIds.filter((selectedId) => selectedId !== optionId)
            : [...selectedIds, optionId];

         return {
            ...currentFilters,
            [key]: nextSelectedIds,
         };
      });
   }, []);

   const filteredMovements = React.useMemo(() => {
      return movements
         .map((movement) => ({ movement, score: getSearchScore(movement, normalizedQuery) }))
         .filter(({ score }) => !normalizedQuery || score > 0)
         .filter(({ movement }) => filterConfigs.every((config) => hasAnySelectedItem(config.getItems(movement), selectedFilters[config.key])))
         .map(({ movement, score }) => ({ ...movement, searchScore: score }));
   }, [movements, normalizedQuery, selectedFilters]);

   const columns = React.useMemo<ColumnDef<ExerciseMovementTableRow>[]>(
      () => [
         {
            accessorKey: "searchScore",
            enableHiding: true,
         },
         {
            accessorKey: "name",
            header: ({ column }) => <SortHeader label="Name" onClick={toggleNameSort} sortDirection={column.getIsSorted()} />,
            sortingFn: (rowA, rowB) => rowA.original.name.localeCompare(rowB.original.name),
            cell: ({ row }) => <span className="text-base font-medium">{row.original.name}</span>,
         },
         {
            accessorKey: "description",
            enableSorting: false,
            header: () => <span className="font-mono text-xs uppercase text-muted-foreground">Description</span>,
            cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.description || "No description yet."}</span>,
         },
         {
            id: "classifications",
            enableSorting: false,
            header: () => <span className="font-mono text-xs uppercase text-muted-foreground">Classifications</span>,
            cell: ({ row }) => <MovementClassifications movement={row.original} />,
         },
      ],
      [toggleNameSort]
   );

   const table = useReactTable({
      columns,
      data: filteredMovements,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
      state: {
         columnVisibility: {
            searchScore: false,
         },
         sorting: effectiveSorting,
      },
   });

   return (
      <TooltipProvider>
         <div className="space-y-5 mt-6">
            <div className="flex flex-col gap-3 border-y border-border py-3 md:flex-row md:items-center md:justify-between">
               <div className="flex min-w-0 flex-1 items-center gap-3">
                  <InputGroup className="max-w-sm flex-1">
                     <InputGroupAddon>
                        <InputGroupText>
                           <MagnifyingGlassIcon />
                        </InputGroupText>
                     </InputGroupAddon>
                     <InputGroupInput
                        aria-label="Search exercises"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search exercises..."
                        type="text"
                        value={query}
                     />
                     {query ? (
                        <InputGroupAddon align="inline-end">
                           <InputGroupButton aria-label="Clear search" onClick={() => setQuery("")} size="icon-xs">
                              <XIcon />
                           </InputGroupButton>
                        </InputGroupAddon>
                     ) : null}
                  </InputGroup>
               </div>

               <div className="flex shrink-0 items-center justify-between gap-3">
                  <p className="font-mono text-xs uppercase text-muted-foreground mt-0">
                     {filteredMovements.length} of {movements.length}
                  </p>
                  {activeFilterCount > 0 ? (
                     <button
                        className="font-mono text-xs uppercase text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        onClick={() => setSelectedFilters(emptyFilters)}
                        type="button"
                     >
                        Clear {activeFilterCount}
                     </button>
                  ) : null}
                  <Popover>
                     <PopoverTrigger
                        render={
                           <button
                              className={cn(
                                 "inline-flex h-9 items-center gap-2 rounded-md border px-3 font-mono text-xs uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                                 activeFilterCount > 0
                                    ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/18 dark:text-emerald-300"
                                    : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                              )}
                              type="button"
                           />
                        }
                     >
                        <FunnelSimpleIcon className="size-4" />
                        Filters
                        {activeFilterCount > 0 ? (
                           <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 font-sans text-[0.7rem] leading-none text-white dark:bg-emerald-500 dark:text-neutral-950">
                              {activeFilterCount}
                           </span>
                        ) : null}
                     </PopoverTrigger>
                     <PopoverContent align="end" className="w-[min(calc(100vw-2rem),44rem)] gap-0 p-4">
                        <FilterPanel
                           activeFilterCount={activeFilterCount}
                           filterOptions={filterOptions}
                           onClear={() => setSelectedFilters(emptyFilters)}
                           onToggle={toggleFilter}
                           selectedFilters={selectedFilters}
                        />
                     </PopoverContent>
                  </Popover>
               </div>
            </div>

            <div className="overflow-hidden rounded-md border border-border">
               <Table>
                  <TableHeader>
                     {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                           {headerGroup.headers.map((header) => (
                              <TableHead
                                 aria-sort={header.column.getCanSort() ? getAriaSort(header.column.getIsSorted()) : undefined}
                                 className={cn(
                                    "border-r border-border last:border-r-0",
                                    header.column.id === "name"
                                       ? "min-w-52"
                                       : header.column.id === "description"
                                         ? "min-w-76"
                                         : header.column.id === "classifications"
                                           ? "min-w-96"
                                           : undefined
                                 )}
                                 key={header.id}
                              >
                                 {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                           ))}
                        </TableRow>
                     ))}
                  </TableHeader>
                  <TableBody>
                     {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                           <TableRow className="group" key={row.id}>
                              {row.getVisibleCells().map((cell) => (
                                 <TableCell
                                    className={cn(
                                       "border-r border-border align-top last:border-r-0",
                                       cell.column.id === "name"
                                          ? "min-w-52 whitespace-normal"
                                          : cell.column.id === "description"
                                            ? "min-w-76 whitespace-normal"
                                            : cell.column.id === "classifications"
                                              ? "min-w-96"
                                              : "whitespace-nowrap"
                                    )}
                                    key={cell.id}
                                 >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                 </TableCell>
                              ))}
                           </TableRow>
                        ))
                     ) : (
                        <TableRow>
                           <TableCell className="text-muted-foreground" colSpan={table.getVisibleLeafColumns().length}>
                              No exercises match the current filters.
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </div>
         </div>
      </TooltipProvider>
   );
}
