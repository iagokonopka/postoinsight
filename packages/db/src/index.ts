export { db } from './client.js'
export type { Db } from './client.js'
export * from './schema/index.js'
// Re-export utilitários comuns do drizzle-orm para consumidores que não precisam
// adicionar drizzle-orm como dependência direta.
export { eq, and, or, sql, inArray, gte, lte, desc, asc, sum, count } from 'drizzle-orm'
