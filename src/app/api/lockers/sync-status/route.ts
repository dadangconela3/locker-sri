import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isOverdue } from '@/lib/contract-utils'

// POST /api/lockers/sync-status - Sync locker statuses
// 1. Mark FILLED lockers as OVERDUE if their active contract is past endDate
// 2. Find FILLED lockers with no active contract (audit)
export async function POST() {
  try {
    const results = {
      overdueUpdated: 0,
      orphanedLockers: [] as { id: string; lockerNumber: string }[],
    }

    // 1. Find all FILLED lockers with active contracts that are overdue
    const filledLockers = await prisma.locker.findMany({
      where: { status: 'FILLED' },
      include: {
        contracts: {
          where: { isActive: true },
          include: { employee: true },
        },
      },
    })

    for (const locker of filledLockers) {
      const activeContract = locker.contracts[0]

      if (!activeContract) {
        // FILLED but no active contract = orphaned locker
        results.orphanedLockers.push({
          id: locker.id,
          lockerNumber: locker.lockerNumber,
        })
        continue
      }

      // Check if contract is overdue (permanent contracts are never overdue)
      if (activeContract.endDate && isOverdue(new Date(activeContract.endDate))) {
        await prisma.locker.update({
          where: { id: locker.id },
          data: { status: 'OVERDUE' },
        })
        results.overdueUpdated++
      }
    }

    // Log the sync activity
    if (results.overdueUpdated > 0 || results.orphanedLockers.length > 0) {
      await prisma.activityLog.create({
        data: {
          action: 'SYNC',
          entity: 'LOCKER',
          description: `Sinkronisasi status: ${results.overdueUpdated} locker diubah ke OVERDUE, ${results.orphanedLockers.length} locker FILLED tanpa karyawan ditemukan`,
          details: JSON.stringify(results),
        },
      })
    }

    return NextResponse.json({
      message: 'Sync completed',
      ...results,
    })
  } catch (error) {
    console.error('Failed to sync locker statuses:', error)
    return NextResponse.json(
      { error: 'Failed to sync locker statuses' },
      { status: 500 }
    )
  }
}
