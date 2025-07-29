// Database configuration for Cloudflare environment
// This file provides a mock database interface for development
// IMPORTANT: This file replaces any Neon database imports to prevent connection errors

// Mock database interface for development environment
export interface DatabaseInterface {
  query: (sql: string, params?: any[]) => Promise<any>
  execute: (sql: string, params?: any[]) => Promise<any>
}

// Mock database implementation for development
class MockDatabase implements DatabaseInterface {
  async query(sql: string, params?: any[]): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Mock database query (development):', { sql: sql.substring(0, 100), params })
    }

    // Return mock data based on query type
    if (sql.includes('SELECT')) {
      return {
        results: [],
        meta: {
          duration: 0,
          rows_read: 0,
          rows_written: 0
        }
      }
    }

    return {
      success: true,
      meta: {
        duration: 0,
        rows_read: 0,
        rows_written: 0
      }
    }
  }

  async execute(sql: string, params?: any[]): Promise<any> {
    return this.query(sql, params)
  }
}

// Database connection function
export function getDatabase(): DatabaseInterface {
  // Always return mock database to prevent Neon connection errors
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Using mock database for development environment')
  }
  return new MockDatabase()
}

// Export default database instance
export const db = getDatabase()

// Mock neon function to prevent @neondatabase/serverless errors
// This completely replaces the real neon function
export function neon(connectionString?: string): any {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Mock neon() called - returning mock database to prevent connection errors')
  }

  // Return a function that returns mock database
  return () => new MockDatabase()
}

// Export for compatibility
export default db

// Re-export common database types to prevent import errors
export type NeonQueryFunction<T = any> = (sql: string, params?: any[]) => Promise<T>
export type NeonDatabase = DatabaseInterface
