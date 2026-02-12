import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:admin123@localhost:5432/locker_db"
    }
  }
})

async function main() {
  console.log('🔍 Inspecting local database: postgresql://postgres:admin123@localhost:5432/locker_db')
  
  try {
    // 1. Check connection
    await prisma.$connect()
    console.log('✅ Connection successful!')

    // 2. Count rows in key tables
    const employees = await prisma.employee.count()
    const lockers = await prisma.locker.count()
    const contracts = await prisma.contract.count()
    const lockerKeys = await prisma.lockerKey.count()

    console.log('\n📊 Row Counts:')
    console.log(`- Employees: ${employees}`)
    console.log(`- Lockers:   ${lockers}`)
    console.log(`- Contracts: ${contracts}`)
    console.log(`- LockerKeys: ${lockerKeys}`)

    if (employees === 0 && lockers === 0) {
      console.log('\n⚠️  The database exists but appears to be empty.')
    } else {
      console.log('\n✅ Data found!')
    }

  } catch (error) {
    console.error('\n❌ Connection failed or error occurred:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
