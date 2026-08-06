import {
   columnVisibilityFeature,
   createSortedRowModel,
   rowSortingFeature,
   sortFn_alphanumeric,
   sortFn_text,
   tableFeatures,
} from "@tanstack/react-table";

export const sortableTableFeatures = tableFeatures({
   columnVisibilityFeature,
   rowSortingFeature,
   sortedRowModel: createSortedRowModel(),
   sortFns: {
      alphanumeric: sortFn_alphanumeric,
      text: sortFn_text,
   },
});
