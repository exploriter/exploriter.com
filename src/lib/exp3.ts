import { env } from "cloudflare:workers";

export type FormationIntersectionSummary = {
   slug: string;
   slugSingular: string;
   name: string;
   nameSingular: string;
   description: string;
};

export type EntrySummary = {
   slug: string;
   title: string;
   description: string;
};

export type EntryPage = EntrySummary & {
   formationIntersection: FormationIntersectionSummary;
};

type FormationIntersectionSummaryRow = {
   slug: string;
   slug_singular: string;
   name: string;
   name_singular: string;
   description: string;
};

type EntryPageRow = {
   slug: string;
   title: string;
   description: string;
   formation_intersection_slug: string;
   formation_intersection_slug_singular: string;
   formation_intersection_name: string;
   formation_intersection_name_singular: string;
   formation_intersection_description: string;
};

const mapFormationIntersectionSummary = (
   row: FormationIntersectionSummaryRow
): FormationIntersectionSummary => ({
   slug: row.slug,
   slugSingular: row.slug_singular,
   name: row.name,
   nameSingular: row.name_singular,
   description: row.description,
});

export const listFormationIntersectionSummaries = async () => {
   const result = await env.EXP3DB.prepare(
      `
      SELECT slug, slug_singular, name, name_singular, description
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
      .first<FormationIntersectionSummaryRow>();

   return row ? mapFormationIntersectionSummary(row) : null;
};

export const listEntrySummariesByFormationIntersectionSlug = async (slug: string) => {
   const result = await env.EXP3DB.prepare(
      `
      SELECT entries.slug, entries.title, entries.description
      FROM formation_intersections
      JOIN entries ON entries.formation_intersection_id = formation_intersections.id
      WHERE formation_intersections.slug = ?
      ORDER BY entries.title ASC
      `
   )
      .bind(slug)
      .all<EntrySummary>();

   return result.results ?? [];
};

export const getEntryPageBySlugs = async (slugSingular: string, entrySlug: string): Promise<EntryPage | null> => {
   const row = await env.EXP3DB.prepare(
      `
      SELECT
         entries.slug,
         entries.title,
         entries.description,
         formation_intersections.slug AS formation_intersection_slug,
         formation_intersections.slug_singular AS formation_intersection_slug_singular,
         formation_intersections.name AS formation_intersection_name,
         formation_intersections.name_singular AS formation_intersection_name_singular,
         formation_intersections.description AS formation_intersection_description
      FROM formation_intersections
      JOIN entries ON entries.formation_intersection_id = formation_intersections.id
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
      formationIntersection: {
         slug: row.formation_intersection_slug,
         slugSingular: row.formation_intersection_slug_singular,
         name: row.formation_intersection_name,
         nameSingular: row.formation_intersection_name_singular,
         description: row.formation_intersection_description,
      },
   };
};
