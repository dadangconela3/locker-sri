import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function main() {
  const localUrl = process.env.DATABASE_URL
  // User will provide CLOUD_DATABASE_URL as an environment variable or argument
  const cloudUrl = process.env.CLOUD_DATABASE_URL

  if (!localUrl) {
    console.error('Error: DATABASE_URL (local) is not defined in .env')
    process.exit(1)
  }

  if (!cloudUrl) {
    console.error('Error: CLOUD_DATABASE_URL is not defined.')
    console.log('Usage: CLOUD_DATABASE_URL="your_vercel_postgres_url" npx tsx scripts/migrate-data.ts')
    process.exit(1)
  }

  console.log('Initializing clients...')
  const localPrisma = new PrismaClient({ datasources: { db: { url: localUrl } } })
  const cloudPrisma = new PrismaClient({ datasources: { db: { url: cloudUrl } } })

  try {
    console.log('Reading local data...')
    
    // 1. Employees
    const employees = await localPrisma.employee.findMany()
    console.log(`Found ${employees.length} employees. Migrating...`)
    for (const emp of employees) {
      // Use upsert to avoid duplicates if run multiple times
      await cloudPrisma.employee.upsert({
        where: { id: emp.id },
        update: {},
        create: emp,
      })
    }

    // 2. Lockers
    const lockers = await localPrisma.locker.findMany()
    console.log(`Found ${lockers.length} lockers. Migrating...`)
    for (const locker of lockers) {
      await cloudPrisma.locker.upsert({
        where: { id: locker.id },
        update: {},
        create: locker,
      })
    }

    // 3. LockerKeys
    const lockerKeys = await localPrisma.lockerKey.findMany()
    console.log(`Found ${lockerKeys.length} locker keys. Migrating...`)
    for (const key of lockerKeys) {
      await cloudPrisma.lockerKey.upsert({
        where: { id: key.id },
        update: {},
        create: key,
      })
    }

    // 4. Contracts
    const contracts = await localPrisma.contract.findMany()
    console.log(`Found ${contracts.length} contracts. Migrating...`)
    for (const contract of contracts) {
      await cloudPrisma.contract.upsert({
        where: { id: contract.id },
        update: {},
        create: contract,
      })
    }

    // 5. KeyLogs
    const keyLogs = await localPrisma.keyLog.findMany()
    console.log(`Found ${keyLogs.length} key logs. Migrating...`)
    for (const log of keyLogs) {
      await cloudPrisma.keyLog.upsert({
        where: { id: log.id },
        update: {},
        create: log,
      })
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await localPrisma.$disconnect()
    await cloudPrisma.$disconnect()
  }
}

main()
