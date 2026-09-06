/**
 * Database availability helper. Pages fall back to mock data when DATABASE_URL
 * is unset so the UI still demos without Postgres.
 */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
