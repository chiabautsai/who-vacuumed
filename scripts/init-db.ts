#!/usr/bin/env tsx

import { initializeDatabase } from '../src/lib/db/migrate'
import { closeDatabase } from '../src/lib/db/connection'

async function main() {
  try {
    console.log('Initializing database...')
    await initializeDatabase()
    console.log('Database initialization completed successfully!')
  } catch (error) {
    console.error('Database initialization failed:', error)
    process.exit(1)
  } finally {
    closeDatabase()
  }
}

main()