/**
 * @typedef {object} MigrationContext
 * @property {import('pino').Logger} log
 * @property {import('mongoose').Connection} connection
 */

/**
 * @typedef {object} Migration
 * @property {string} name
 * @property {string} description
 * @property {(ctx: MigrationContext) => Promise<void>} up
 * @property {(ctx: MigrationContext) => Promise<void>} [down]
 */

export {};
