'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardStats } from '@/types'
import { Box, CheckCircle, Users, AlertTriangle, Wrench, HelpCircle } from 'lucide-react'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total',
      value: stats.total,
      icon: Box,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      title: 'Available',
      value: stats.available,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      title: 'In Use',
      value: stats.filled,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Maintenance',
      value: stats.maintenance,
      icon: Wrench,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      title: 'Unidentified',
      value: stats.unidentified,
      icon: HelpCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
  ]
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={`${card.bgColor} border-0 shadow-sm`}>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
              {card.title}
            </CardTitle>
            <card.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${card.color}`} />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-xl sm:text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
