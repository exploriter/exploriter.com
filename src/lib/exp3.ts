import { env } from "cloudflare:workers";

export type ConceptKind = "INDIVIDUAL" | "COLLECTION";

export type FormationIntersectionSummary = {
   slug: string;
   slugSingular: string;
   name: string;
   nameSingular: string;
   description: string;
   essence: string;
};

export type FormationIntersectionPageSummary = Pick<FormationIntersectionSummary, "slug" | "slugSingular" | "name" | "nameSingular" | "description">;

export type AnalogSummary = {
   slug: string;
   name: string;
};

export type EntrySummary = {
   slug: string;
   title: string;
   description: string;
   conceptKind: ConceptKind | null;
};

export type EntryPage = EntrySummary & {
   formationIntersection: Pick<FormationIntersectionSummary, "slug" | "name" | "nameSingular">;
};

export type EntryWithFormationIntersection = EntrySummary & {
   formationIntersection: Pick<FormationIntersectionSummary, "slug" | "slugSingular" | "nameSingular"> & {
      sortOrder: number;
   };
};

type FormationIntersectionSummaryRow = {
   slug: string;
   slug_singular: string;
   name: string;
   name_singular: string;
   description: string;
   essence: string;
};

type FormationIntersectionPageSummaryRow = {
   slug: string;
   slug_singular: string;
   name: string;
   name_singular: string;
   description: string;
};

type AnalogSummaryRow = {
   slug: string;
   name: string;
};

type EntrySummaryRow = {
   slug: string;
   title: string;
   description: string;
   concept_kind: ConceptKind | null;
};

type EntryPageRow = {
   slug: string;
   title: string;
   description: string;
   concept_kind: ConceptKind | null;
   formation_intersection_slug: string;
   formation_intersection_name: string;
   formation_intersection_name_singular: string;
};

type EntryWithFormationIntersectionRow = EntrySummaryRow & {
   formation_intersection_slug: string;
   formation_intersection_slug_singular: string;
   formation_intersection_name_singular: string;
   formation_intersection_sort_order: number;
};

const mapFormationIntersectionSummary = (row: FormationIntersectionSummaryRow): FormationIntersectionSummary => ({
   slug: row.slug,
   slugSingular: row.slug_singular,
   name: row.name,
   nameSingular: row.name_singular,
   description: row.description,
   essence: row.essence,
});

const mapEntrySummary = (row: EntrySummaryRow): EntrySummary => ({
   slug: row.slug,
   title: row.title,
   description: row.description,
   conceptKind: row.concept_kind,
});

const mapFormationIntersectionPageSummary = (row: FormationIntersectionPageSummaryRow): FormationIntersectionPageSummary => ({
   slug: row.slug,
   slugSingular: row.slug_singular,
   name: row.name,
   nameSingular: row.name_singular,
   description: row.description,
});

const mapAnalogSummary = (row: AnalogSummaryRow): AnalogSummary => ({
   slug: row.slug,
   name: row.name,
});

const mapEntryWithFormationIntersection = (row: EntryWithFormationIntersectionRow): EntryWithFormationIntersection => ({
   ...mapEntrySummary(row),
   formationIntersection: {
      slug: row.formation_intersection_slug,
      slugSingular: row.formation_intersection_slug_singular,
      nameSingular: row.formation_intersection_name_singular,
      sortOrder: row.formation_intersection_sort_order,
   },
});

export const listFormationIntersectionSummaries = async () => {
   const result = await env.EXP3DB.prepare(
      `
      SELECT slug, slug_singular, name, name_singular, description, essence
      FROM formation_intersections
      ORDER BY sort_order ASC
      `
   ).all<FormationIntersectionSummaryRow>();

   return (result.results ?? []).map(mapFormationIntersectionSummary);
};

export const getFormationIntersectionSummaryBySlug = async (slug: string) => {
   const row = await env.EXP3DB.prepare(
      `
      SELECT slug, slug_singular, name, name_singular, description
      FROM formation_intersections
      WHERE slug = ?
      LIMIT 1
      `
   )
      .bind(slug)
      .first<FormationIntersectionPageSummaryRow>();

   return row ? mapFormationIntersectionPageSummary(row) : null;
};

export const listAnalogSummariesByFormationIntersectionSlug = async (slug: string) => {
   const result = await env.EXP3DB.prepare(
      `
      SELECT
         analogs.slug,
         analogs.name
      FROM formation_intersections
      JOIN analog_formation_intersections ON analog_formation_intersections.formation_intersection_id = formation_intersections.id
      JOIN analogs ON analogs.id = analog_formation_intersections.analog_id
      WHERE formation_intersections.slug = ?
      ORDER BY analogs.name COLLATE NOCASE ASC, analogs.slug ASC
      `
   )
      .bind(slug)
      .all<AnalogSummaryRow>();

   return (result.results ?? []).map(mapAnalogSummary);
};

export const listEntrySummariesByFormationIntersectionSlug = async (slug: string) => {
   const result = await env.EXP3DB.prepare(
      `
      SELECT
         entries.slug,
         entries.title,
         entries.description,
         concept_entry_details.concept_kind
      FROM formation_intersections
      JOIN entries ON entries.formation_intersection_id = formation_intersections.id
      LEFT JOIN concept_entry_details ON concept_entry_details.entry_id = entries.id
      WHERE formation_intersections.slug = ?
      ORDER BY entries.title ASC
      `
   )
      .bind(slug)
      .all<EntrySummaryRow>();

   return (result.results ?? []).map(mapEntrySummary);
};

export const listAllEntrySummaries = async () => {
   const result = await env.EXP3DB.prepare(
      `
      SELECT
         entries.slug,
         entries.title,
         entries.description,
         concept_entry_details.concept_kind,
         formation_intersections.slug AS formation_intersection_slug,
         formation_intersections.slug_singular AS formation_intersection_slug_singular,
         formation_intersections.name_singular AS formation_intersection_name_singular,
         formation_intersections.sort_order AS formation_intersection_sort_order
      FROM entries
      JOIN formation_intersections ON formation_intersections.id = entries.formation_intersection_id
      LEFT JOIN concept_entry_details ON concept_entry_details.entry_id = entries.id
      ORDER BY entries.title COLLATE NOCASE ASC, entries.slug ASC
      `
   ).all<EntryWithFormationIntersectionRow>();

   return (result.results ?? []).map(mapEntryWithFormationIntersection);
};

export const getEntryPageBySlugs = async (slugSingular: string, entrySlug: string): Promise<EntryPage | null> => {
   const row = await env.EXP3DB.prepare(
      `
      SELECT
         entries.slug,
         entries.title,
         entries.description,
         concept_entry_details.concept_kind,
         formation_intersections.slug AS formation_intersection_slug,
         formation_intersections.name AS formation_intersection_name,
         formation_intersections.name_singular AS formation_intersection_name_singular
      FROM formation_intersections
      JOIN entries ON entries.formation_intersection_id = formation_intersections.id
      LEFT JOIN concept_entry_details ON concept_entry_details.entry_id = entries.id
      WHERE formation_intersections.slug_singular = ? AND entries.slug = ?
      LIMIT 1
      `
   )
      .bind(slugSingular, entrySlug)
      .first<EntryPageRow>();

   if (!row) return null;

   return {
      slug: row.slug,
      title: row.title,
      description: row.description,
      conceptKind: row.concept_kind,
      formationIntersection: {
         slug: row.formation_intersection_slug,
         name: row.formation_intersection_name,
         nameSingular: row.formation_intersection_name_singular,
      },
   };
};
