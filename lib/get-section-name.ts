type SectionRelation = { name?: string | null } | Array<{ name?: string | null }> | null | undefined

/**
 * Supabase returns an embedded to-one relation as an object, but the generated
 * types can widen it to an array. Read the section name from either shape.
 */
export function getSectionName(relation: SectionRelation): string | undefined {
  if (!relation) return undefined
  const section = Array.isArray(relation) ? relation[0] : relation
  return section?.name ?? undefined
}
