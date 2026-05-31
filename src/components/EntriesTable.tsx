import * as React from "react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { CaretDownIcon, CaretUpDownIcon, CaretUpIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

import SectionIcon, { ConceptKindIcon } from "@/components/icons/section-icon";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ConceptKind, EntrySummary, EntryWithFormationIntersection } from "@/lib/exp3";

type EntriesTableProps = {
   entries: Array<EntrySummary | EntryWithFormationIntersection>;
   sectionSlugSingular?: string;
};

type EntryTableRow = EntrySummary & {
   href: string;
   iconSort: string;
   formationIntersection?: EntryWithFormationIntersection["formationIntersection"];
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

const getIconSorting = (sorting: SortingState) => sorting.find((sort) => sort.id === "iconSort");

export default function EntriesTable({ entries, sectionSlugSingular }: EntriesTableProps) {
   const [query, setQuery] = React.useState("");
   const [sorting, setSorting] = React.useState<SortingState>([{ id: "title", desc: false }]);
   const showIconColumn = sectionSlugSingular === "concept" || entries.some(hasFormationIntersection);
   const normalizedQuery = query.trim().toLowerCase();
   const effectiveSorting = React.useMemo<SortingState>(
      () => (normalizedQuery ? [{ id: "searchScore", desc: true }, ...sorting] : sorting),
      [normalizedQuery, sorting]
   );

   const toggleTitleSort = React.useCallback(() => {
      setSorting((currentSorting) => {
         const iconSort = getIconSorting(currentSorting);
         const nextTitleSort = { id: "title", desc: !getTitleDesc(currentSorting) };
         return iconSort ? [iconSort, nextTitleSort] : [nextTitleSort];
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

   const filteredEntries = React.useMemo(() => {
      return entries
         .map((entry) => ({ entry, score: getSearchScore(entry, normalizedQuery) }))
         .filter(({ score }) => !normalizedQuery || score > 0)
         .map(({ entry, score }) => ({
            ...entry,
            href: getEntryHref(entry, sectionSlugSingular),
            iconSort: getIconSort(entry),
            searchScore: score,
         }));
   }, [entries, normalizedQuery, sectionSlugSingular]);

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
                  <div className="flex items-start pl-2 pt-0.5">
                     <EntryIcon entry={row.original} />
                     <span className="sr-only">{row.original.iconSort}</span>
                  </div>
               ) : null,
         },
         ...sharedColumns,
      ];
   }, [showIconColumn, toggleTitleSort, toggleTypeSort]);

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
                  placeholder="Search entries..."
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
            <p className="shrink-0 font-mono text-xs uppercase text-muted-foreground">{entries.length} total</p>
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
                     <TableRow className="group" key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                           <TableCell
                              className={
                                 cell.column.id === "description"
                                    ? "min-w-72 whitespace-normal py-5"
                                    : cell.column.id === "iconSort"
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
