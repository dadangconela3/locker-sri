import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
prisma.employee.count().then(count => {
  console.log('Employee count:', count)
  return prisma.$disconnect()
})
