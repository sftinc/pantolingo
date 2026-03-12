/**
 * PostgreSQL connection pool
 * Replaces in-memory cache with persistent database storage
 */

import { Pool } from 'pg'

// Lazy pool initialization to ensure env vars are loaded first
let _pool: Pool | null = null

function getPool(): Pool {
	if (!_pool) {
		_pool = new Pool({
			connectionString: process.env.POSTGRES_DB_URL,
			max: 50, // Maximum connections (single instance)
			idleTimeoutMillis: 30000, // Close idle connections after 30s
			connectionTimeoutMillis: 10000, // Connection timeout
			keepAlive: true, // Detect dead connections
			keepAliveInitialDelayMillis: 10000,
			ssl: process.env.POSTGRES_DB_URL?.includes('render.com')
				? { rejectUnauthorized: false }
				: false, // Only use SSL for Render
		})

		// Prevent crash when an idle client receives an error (e.g. connection reset)
		_pool.on('error', (err) => {
			console.error('Unexpected error on idle database client:', err.message)
		})
	}
	return _pool
}

function queryLabel(sql: string): string {
	const match = sql.match(/\b(SELECT|INSERT|UPDATE|DELETE)\b.*?\b(?:FROM|INTO|UPDATE|TABLE)\s+(\w+)/is)
	return match ? `${match[1].toUpperCase()} ${match[2]}` : sql.substring(0, 40)
}

// Export pool as a Proxy that lazily initializes the real pool
// This ensures env vars are loaded before pool creation
export const pool: Pool = new Proxy({} as Pool, {
	get(_, prop: keyof Pool) {
		const realPool = getPool()

		if (prop === 'query') {
			return async (...args: any[]) => {
				const start = performance.now()
				const result = await (realPool.query as Function)(...args)
				console.log(`[DB] ${(performance.now() - start).toFixed(1)}ms | ${queryLabel(args[0])}`)
				return result
			}
		}

		if (prop === 'connect') {
			return async () => {
				const client = await realPool.connect()
				const origQuery = client.query.bind(client)
				client.query = (async (...args: any[]) => {
					const start = performance.now()
					const result = await (origQuery as Function)(...args)
					console.log(`[DB] ${(performance.now() - start).toFixed(1)}ms | ${queryLabel(args[0])}`)
					return result
				}) as typeof client.query
				return client
			}
		}

		const value = realPool[prop]
		if (typeof value === 'function') return value.bind(realPool)
		return value
	},
})

/**
 * Test database connection
 * Call on startup to verify connectivity
 */
export async function testConnection(): Promise<boolean> {
	try {
		await pool.query('SELECT 1')
		return true
	} catch (error) {
		console.error('PostgreSQL connection failed:', error)
		return false
	}
}

/**
 * Graceful shutdown - close all connections
 */
export async function closePool(): Promise<void> {
	if (_pool) {
		await _pool.end()
		_pool = null
	}
}
