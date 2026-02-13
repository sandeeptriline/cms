'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LayoutDashboard, Users, Settings, Database, BarChart3 } from 'lucide-react'
import { ReactNode } from 'react'

interface TabConfig {
  value: string
  label: string
  icon: ReactNode
  content: ReactNode
  badge?: number | string
}

interface TenantTabsProps {
  tabs: TabConfig[]
  defaultTab?: string
  onTabChange?: (value: string) => void
}

export function TenantTabs({ tabs, defaultTab = 'overview', onTabChange }: TenantTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} onValueChange={onTabChange} className="w-full">
      <div className="border-b border-border px-6">
        <TabsList className="bg-transparent h-12 p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none h-12 px-4"
            >
              <div className="flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                    {tab.badge}
                  </span>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
