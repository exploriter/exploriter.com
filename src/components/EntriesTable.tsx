import * as React from "react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import {
   CaretDownIcon,
   CaretUpDownIcon,
   CaretUpIcon,
   GearFineIcon,
   MagnifyingGlassIcon,
   SealCheckIcon,
   SkullIcon,
   XIcon,
} from "@phosphor-icons/react";

import SectionIcon, { ConceptKindIcon } from "@/components/icons/section-icon";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/css";
import type { ConceptKind, EntrySummary, EntryWithFormationIntersection, ProjectStatus } from "@/lib/exp3";

type EntriesTableProps = {
   entries: Array<EntrySummary | EntryWithFormationIntersection>;
   searchPlaceholder?: string;
   sectionSlugSingular?: string;
};

type EntryTableRow = EntrySummary & {
   href: string;
   iconSort: string;
   formationIntersection?: EntryWithFormationIntersection["formationIntersection"];
   projectDobSort: number | null;
   searchScore: number;
};

const conceptKindLabels = {
   INDIVIDUAL: "Individual Concept",
   COLLECTION: "Concept Collection",
} satisfies Record<ConceptKind, string>;

const getSearchScore = (entry: EntrySummary, query: string) => {
   const normalizedQuery = query.trim().toLowerCase();
   if (!normalizedQuery) return 0;

   const title = entry.title.toLowerCase();
   const description = entry.description.toLowerCase();
   let score = 0;

   if (title === normalizedQuery) score += 120;
   if (title.startsWith(normalizedQuery)) score += 80;
   if (title.includes(normalizedQuery)) score += 40;
   if (description.includes(normalizedQuery)) score += 4;

   return score;
};

const hasFormationIntersection = (entry: EntrySummary | EntryWithFormationIntersection): entry is EntryWithFormationIntersection => {
   return "formationIntersection" in entry;
};

const getEntryHref = (entry: EntrySummary | EntryWithFormationIntersection, sectionSlugSingular?: string) => {
   if (hasFormationIntersection(entry)) return `/${entry.formationIntersection.slugSingular}/${entry.slug}`;
   return `/${sectionSlugSingular}/${entry.slug}`;
};

const getIconSort = (entry: EntrySummary | EntryWithFormationIntersection) => {
   if (entry.conceptKind) return conceptKindLabels[entry.conceptKind];
   if (hasFormationIntersection(entry)) return entry.formationIntersection.nameSingular;
   return "";
};

const getConceptIconSortRank = (value: string) => {
   if (value === conceptKindLabels.INDIVIDUAL) return 0;
   if (value === conceptKindLabels.COLLECTION) return 1;
   return 2;
};

const getTypeSortPrimaryValue = (entry: EntryTableRow) => entry.formationIntersection?.sortOrder ?? getConceptIconSortRank(entry.iconSort);

const getTypeSortSecondaryValue = (entry: EntryTableRow) => (entry.conceptKind ? getConceptIconSortRank(entry.iconSort) : 0);

const projectStatusConfig = {
   LIVE: {
      badgeClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      icon: SealCheckIcon,
      label: "Live",
      sortOrder: 0,
   },
   PUBLISHED: {
      badgeClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      icon: SealCheckIcon,
      label: "Published",
      sortOrder: 1,
   },
   BUILDING: {
      badgeClassName: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      icon: GearFineIcon,
      label: "Building...",
      sortOrder: 2,
   },
   RETIRED: {
      badgeClassName: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
      icon: SkullIcon,
      label: "Retired",
      sortOrder: 3,
   },
} satisfies Record<
   ProjectStatus,
   { badgeClassName: string; icon: React.ComponentType<{ className?: string; "data-icon"?: string }>; label: string; sortOrder: number }
>;

const getProjectDateLabel = (entry: EntryTableRow) => {
   if (!entry.projectDobYear) return "";
   if (entry.projectDodYear) return `${entry.projectDobYear}-${entry.projectDodYear}`;
   return String(entry.projectDobYear);
};

function ProjectStatusLabel({ status }: { status: ProjectStatus | null | undefined }) {
   if (!status) return null;

   const config = projectStatusConfig[status];
   const Icon = config.icon;

   return (
      <Badge className={cn("border", config.badgeClassName)} variant="outline">
         <Icon data-icon="inline-start" />
         {config.label}
      </Badge>
   );
}

const getProjectStatusRowClassName = (status: ProjectStatus | null | undefined) => {
   if (status === "RETIRED") return "bg-red-500/[0.035] hover:bg-red-500/[0.06]";
   if (status === "BUILDING") return "bg-amber-500/[0.04] hover:bg-amber-500/[0.065]";
   if (status === "LIVE" || status === "PUBLISHED") return "bg-emerald-500/[0.035] hover:bg-emerald-500/[0.06]";
   return null;
};

function EntryIcon({ entry }: { entry: EntryTableRow }) {
   if (entry.conceptKind) {
      return <ConceptKindIcon className="size-5" conceptKind={entry.conceptKind} weight="regular" />;
   }

   if (entry.formationIntersection) {
      return (
         <SectionIcon className="size-5" label={entry.formationIntersection.nameSingular} slug={entry.formationIntersection.slug} weight="regular" />
      );
   }

   return null;
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
   if (direction === "asc") return <CaretUpIcon className="size-3.5" />;
   if (direction === "desc") return <CaretDownIcon className="size-3.5" />;
   return <CaretUpDownIcon className="size-3.5 opacity-45" />;
}

function SortHeader({ label, onClick, sortDirection }: { label: string; onClick: () => void; sortDirection: false | "asc" | "desc" }) {
   return (
      <button
         aria-label={`Sort by ${label.toLowerCase()}`}
         className="-ml-2 inline-flex h-8 items-center gap-1 rounded-sm px-2 font-mono text-xs uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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

const getTitleDesc = (sorting: SortingState) => sorting.find((sort) => sort.id === "title")?.desc ?? false;

const getTitleSorting = (sorting: SortingState) => sorting.find((sort) => sort.id === "title");

const getIconSorting = (sorting: SortingState) => sorting.find((sort) => sort.id === "iconSort");

const getProjectDobSorting = (sorting: SortingState) => sorting.find((sort) => sort.id === "projectDobSort");

const getProjectStatusSorting = (sorting: SortingState) => sorting.find((sort) => sort.id === "projectStatus");

export default function EntriesTable({ entries, searchPlaceholder = "Search entries...", sectionSlugSingular }: EntriesTableProps) {
   const isProjectsSection = sectionSlugSingular === "project";
   const [query, setQuery] = React.useState("");
   const [showRetired, setShowRetired] = React.useState(false);
   const [sorting, setSorting] = React.useState<SortingState>([{ id: isProjectsSection ? "projectDobSort" : "title", desc: isProjectsSection }]);
   const showIconColumn = sectionSlugSingular === "concept" || entries.some(hasFormationIntersection);
   const normalizedQuery = query.trim().toLowerCase();
   const effectiveSorting = React.useMemo<SortingState>(
      () => (normalizedQuery ? [{ id: "searchScore", desc: true }, ...sorting] : sorting),
      [normalizedQuery, sorting]
   );

   const toggleTitleSort = React.useCallback(() => {
      setSorting((currentSorting) => {
         const iconSort = getIconSorting(currentSorting);
         const titleSort = getTitleSorting(currentSorting);
         const nextTitleSort = { id: "title", desc: titleSort ? !titleSort.desc : false };
         return iconSort ? [iconSort, nextTitleSort] : [nextTitleSort];
      });
   }, []);

   const toggleProjectDobSort = React.useCallback(() => {
      setSorting((currentSorting) => {
         const dobSort = getProjectDobSorting(currentSorting);
         return [{ id: "projectDobSort", desc: dobSort ? !dobSort.desc : false }];
      });
   }, []);

   const toggleProjectStatusSort = React.useCallback(() => {
      setSorting((currentSorting) => {
         const statusSort = getProjectStatusSorting(currentSorting);
         return [{ id: "projectStatus", desc: statusSort ? !statusSort.desc : false }];
      });
   }, []);

   const toggleTypeSort = React.useCallback(() => {
      setSorting((currentSorting) => {
         const titleSort = { id: "title", desc: getTitleDesc(currentSorting) };
         const iconSort = getIconSorting(currentSorting);

         if (!iconSort) return [{ id: "iconSort", desc: false }, titleSort];
         if (!iconSort.desc) return [{ id: "iconSort", desc: true }, titleSort];

         return [titleSort];
      });
   }, []);

   const statusFilteredEntries = React.useMemo(() => {
      if (!isProjectsSection || showRetired) return entries;
      return entries.filter((entry) => entry.projectStatus !== "RETIRED");
   }, [entries, isProjectsSection, showRetired]);

   const filteredEntries = React.useMemo(() => {
      return statusFilteredEntries
         .map((entry) => ({ entry, score: getSearchScore(entry, normalizedQuery) }))
         .filter(({ score }) => !normalizedQuery || score > 0)
         .map(({ entry, score }) => ({
            ...entry,
            href: getEntryHref(entry, sectionSlugSingular),
            iconSort: getIconSort(entry),
            projectDobSort: entry.projectDobYear ?? null,
            searchScore: score,
         }));
   }, [normalizedQuery, sectionSlugSingular, statusFilteredEntries]);

   const columns = React.useMemo<ColumnDef<EntryTableRow>[]>(() => {
      const sharedColumns: ColumnDef<EntryTableRow>[] = [
         {
            accessorKey: "searchScore",
            enableHiding: true,
         },
         {
            accessorKey: "title",
            header: ({ column }) => <SortHeader label="Title" onClick={toggleTitleSort} sortDirection={column.getIsSorted()} />,
            cell: ({ row }) => (
               <a className="text-base leading-6 hover:underline hover:decoration-1 hover:underline-offset-2" href={row.original.href}>
                  {row.original.title}
               </a>
            ),
         },
         ...(isProjectsSection
            ? [
                 {
                    accessorKey: "projectDobSort",
                    header: ({ column }) => <SortHeader label="DOB-DOD" onClick={toggleProjectDobSort} sortDirection={column.getIsSorted()} />,
                    sortingFn: (rowA, rowB) => {
                       const valueA = rowA.original.projectDobSort;
                       const valueB = rowB.original.projectDobSort;

                       if (valueA === null && valueB === null) return 0;
                       if (valueA === null) return 1;
                       if (valueB === null) return -1;

                       return valueA - valueB;
                    },
                    cell: ({ row }) => <span className="text-sm leading-6 text-muted-foreground font-mono">{getProjectDateLabel(row.original)}</span>,
                 } satisfies ColumnDef<EntryTableRow>,
                 {
                    accessorKey: "projectStatus",
                    header: ({ column }) => <SortHeader label="Status" onClick={toggleProjectStatusSort} sortDirection={column.getIsSorted()} />,
                    sortingFn: (rowA, rowB) => {
                       const valueA = rowA.original.projectStatus;
                       const valueB = rowB.original.projectStatus;

                       if (!valueA && !valueB) return 0;
                       if (!valueA) return 1;
                       if (!valueB) return -1;

                       return projectStatusConfig[valueA].sortOrder - projectStatusConfig[valueB].sortOrder;
                    },
                    cell: ({ row }) => <ProjectStatusLabel status={row.original.projectStatus} />,
                 } satisfies ColumnDef<EntryTableRow>,
              ]
            : []),
         {
            accessorKey: "description",
            enableSorting: false,
            header: () => <span className="font-mono text-xs uppercase text-muted-foreground">Description</span>,
            cell: ({ row }) => <span className="text-base leading-6 text-muted-foreground">{row.original.description}</span>,
         },
      ];

      if (!showIconColumn) return sharedColumns;

      return [
         {
            accessorKey: "iconSort",
            header: ({ column }) => <SortHeader label="Type" onClick={toggleTypeSort} sortDirection={column.getIsSorted()} />,
            sortingFn: (rowA, rowB) => {
               const valueA = rowA.original.iconSort;
               const valueB = rowB.original.iconSort;
               const rankA = getTypeSortPrimaryValue(rowA.original);
               const rankB = getTypeSortPrimaryValue(rowB.original);

               if (rankA !== rankB) return rankA - rankB;

               const secondaryRankA = getTypeSortSecondaryValue(rowA.original);
               const secondaryRankB = getTypeSortSecondaryValue(rowB.original);

               if (secondaryRankA !== secondaryRankB) return secondaryRankA - secondaryRankB;

               return valueA.localeCompare(valueB);
            },
            cell: ({ row }) =>
               row.original.iconSort ? (
                  <div className="flex items-start pl-1.75 pt-0.5">
                     <EntryIcon entry={row.original} />
                     <span className="sr-only">{row.original.iconSort}</span>
                  </div>
               ) : null,
         },
         ...sharedColumns,
      ];
   }, [isProjectsSection, showIconColumn, toggleProjectDobSort, toggleProjectStatusSort, toggleTitleSort, toggleTypeSort]);

   const table = useReactTable({
      columns,
      data: filteredEntries,
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
      <div>
         <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <InputGroup className="max-w-sm">
               <InputGroupAddon>
                  <InputGroupText>
                     <MagnifyingGlassIcon />
                  </InputGroupText>
               </InputGroupAddon>
               <InputGroupInput
                  aria-label="Search entries"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
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
            <div className="flex shrink-0 items-center gap-4">
               {isProjectsSection ? (
                  <>
                     <label className="flex items-center gap-2 font-mono text-xs uppercase text-muted-foreground">
                        <Switch checked={showRetired} onCheckedChange={setShowRetired} size="sm" />
                        Show Retired
                     </label>
                     <span className="font-mono text-xs text-muted-foreground" aria-hidden="true">
                        &middot;
                     </span>
                  </>
               ) : null}
               <p className="font-mono text-xs uppercase text-muted-foreground">{statusFilteredEntries.length} total</p>
            </div>
         </div>

         <Table>
            <TableHeader>
               {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                     {headerGroup.headers.map((header) => (
                        <TableHead
                           aria-sort={header.column.getCanSort() ? getAriaSort(header.column.getIsSorted()) : undefined}
                           className={
                              header.column.id === "iconSort"
                                 ? "w-px whitespace-nowrap"
                                 : header.column.id === "projectDobSort"
                                   ? "w-px whitespace-nowrap"
                                   : header.column.id === "projectStatus"
                                     ? "w-px whitespace-nowrap"
                                     : header.column.id === "title"
                                       ? "min-w-48"
                                       : header.column.id === "description"
                                         ? "min-w-72"
                                         : undefined
                           }
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
                     <TableRow className={cn("group", getProjectStatusRowClassName(row.original.projectStatus))} key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                           <TableCell
                              className={
                                 cell.column.id === "description"
                                    ? "min-w-72 whitespace-normal py-5"
                                    : cell.column.id === "iconSort"
                                      ? "w-px whitespace-nowrap py-5"
                                      : cell.column.id === "projectDobSort" || cell.column.id === "projectStatus"
                                        ? "w-px whitespace-nowrap py-5"
                                        : cell.column.id === "title"
                                          ? "min-w-48 whitespace-normal py-5"
                                          : "whitespace-nowrap py-5"
                              }
                              key={cell.id}
                           >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                           </TableCell>
                        ))}
                     </TableRow>
                  ))
               ) : (
                  <TableRow>
                     <TableCell className="py-6 leading-6 text-muted-foreground" colSpan={table.getVisibleLeafColumns().length}>
                        No entries match your search.
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
         </Table>
      </div>
   );
}
