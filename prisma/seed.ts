import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Room configurations
const rooms = [
  { roomId: 'M01', count: 218, name: 'Male 01' },
  { roomId: 'M02', count: 42, name: 'Male 02' },
  { roomId: 'F01', count: 94, name: 'Female 01' },
]

async function main() {
  console.log('🌱 Starting database seeding...')
  
  // Clear existing data
  await prisma.keyLog.deleteMany()
  await prisma.lockerKey.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.locker.deleteMany()
  await prisma.employee.deleteMany()
  
  console.log('🗑️  Cleared existing data')
  
  // Create lockers for each room
  for (const room of rooms) {
    const lockers = []
    
    for (let i = 1; i <= room.count; i++) {
      const lockerNumber = `L/${room.roomId}/${String(i).padStart(3, '0')}`
      lockers.push({
        lockerNumber,
        roomId: room.roomId,
      })
    }
    
    await prisma.locker.createMany({
      data: lockers,
    })
    
    console.log(`✅ Created ${room.count} lockers for ${room.name} (${room.roomId})`)
  }
  
  // Create keys for each locker (2 keys per locker: 1 for employee, 1 for HRGA backup)
  const allLockers = await prisma.locker.findMany()
  
  for (const locker of allLockers) {
    // Extract locker number for physical key number (e.g., "L/M01/001" -> "M01-001")
    const parts = locker.lockerNumber.split('/')
    const physicalNumber = `${parts[1]}-${parts[2]}`
    
    await prisma.lockerKey.createMany({
      data: [
        {
          lockerId: locker.id,
          keyNumber: 1,
          physicalKeyNumber: physicalNumber, // Employee key has physical number
          label: 'Employee Key',
          status: 'AVAILABLE',
        },
        {
          lockerId: locker.id,
          keyNumber: 2,
          physicalKeyNumber: null, // HRGA backup is duplicate, no physical number
          label: 'HRGA Backup',
          status: 'WITH_HRGA',
        },
      ],
    })
  }
  
  console.log(`✅ Created ${allLockers.length * 2} keys (2 per locker)`)
  
  // Create some sample employees for testing
  const sampleEmployees = [
    { nik: 'EMP001', name: 'John Doe', department: 'Engineering' },
    { nik: 'EMP002', name: 'Jane Smith', department: 'Marketing' },
    { nik: 'EMP003', name: 'Bob Wilson', department: 'Finance' },
    { nik: 'EMP004', name: 'Alice Brown', department: 'HR' },
    { nik: 'EMP005', name: 'Charlie Davis', department: 'IT' },
    { nik: 'HRGA001', name: 'HRGA Admin', department: 'HRGA' },
  ]
  
  for (const emp of sampleEmployees) {
    await prisma.employee.create({
      data: emp,
    })
  }
  
  console.log(`✅ Created ${sampleEmployees.length} sample employees`)
  
  // Get some lockers and employees for sample contracts
  const lockers = await prisma.locker.findMany({ take: 5 })
  const employees = await prisma.employee.findMany()
  
  // Create sample contracts (some active, some expired for testing overdue)
  const today = new Date()
  const sampleContracts = [
    {
      employeeId: employees[0].id,
      lockerId: lockers[0].id,
      contractSeq: 1,
      startDate: new Date(today.getFullYear(), today.getMonth() - 6, 1),
      endDate: new Date(today.getFullYear(), today.getMonth() + 6, 1),
      isActive: true,
    },
    {
      employeeId: employees[1].id,
      lockerId: lockers[1].id,
      contractSeq: 1,
      startDate: new Date(today.getFullYear(), today.getMonth() - 12, 1),
      endDate: new Date(today.getFullYear(), today.getMonth() - 1, 1), // Expired - OVERDUE
      isActive: true,
    },
    {
      employeeId: employees[2].id,
      lockerId: lockers[2].id,
      contractSeq: 1,
      startDate: new Date(today.getFullYear(), today.getMonth() - 3, 1),
      endDate: new Date(today.getFullYear(), today.getMonth() + 3, 1),
      isActive: true,
    },
  ]
  
  for (const contract of sampleContracts) {
    await prisma.contract.create({
      data: contract,
    })
    
    // Update locker status based on contract
    const isOverdue = contract.endDate < today
    await prisma.locker.update({
      where: { id: contract.lockerId },
      data: { status: isOverdue ? 'OVERDUE' : 'FILLED' },
    })
    
    // Assign employee key to the contract holder
    const employeeKey = await prisma.lockerKey.findFirst({
      where: { lockerId: contract.lockerId, keyNumber: 1 },
    })
    
    if (employeeKey) {
      await prisma.lockerKey.update({
        where: { id: employeeKey.id },
        data: { 
          holderId: contract.employeeId,
          status: 'WITH_EMPLOYEE',
        },
      })
    }
  }
  
  console.log(`✅ Created ${sampleContracts.length} sample contracts with key assignments`)
  
  console.log('🎉 Database seeding completed!')
  console.log(`   Total lockers: ${218 + 42 + 94} (M01: 218, M02: 42, F01: 94)`)
  console.log(`   Total keys: ${(218 + 42 + 94) * 2} (2 per locker)`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
