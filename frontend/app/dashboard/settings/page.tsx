'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Settings, Database, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useProject } from '@/contexts/project-context'
import { isAdmin } from '@/lib/utils/roles'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  GitBranch,
  Shield,
  Lock,
  Palette,
  Bookmark,
  Languages,
  Sparkles,
  Store,
  Puzzle,
  FileCode,
  Bug,
  Lightbulb,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const { currentProject } = useProject()
  const router = useRouter()
  const isAdminUser = isAdmin(user?.roles)

  useEffect(() => {
    if (!authLoading && !isAdminUser) {
      router.replace('/dashboard')
    }
  }, [authLoading, isAdminUser, router])

  if (authLoading || !isAdminUser) {
    return (
      <DashboardLayout basePath="/dashboard" title="Settings" icon={<Settings className="h-5 w-5" />}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </DashboardLayout>
    )
  }

  // Generate project-scoped paths for project-scoped routes
  const getProjectPath = (route: string) => {
    if (!currentProject) {
      // No project selected, link to projects page
      return '/dashboard/settings/projects'
    }
    return `/dashboard/settings/projects/${currentProject.id}${route}`
  }

  const settingsSections = [
        {
      title: 'Settings',
      items: [
        { name: 'Content Model', path: getProjectPath('/data-model'), icon: Database, description: 'Manage content schemas and field definitions' },
        { name: 'Components', path: getProjectPath('/components'), icon: Puzzle, description: 'Reusable blocks of fields for content models' },
        { name: 'Flows', path: getProjectPath('/flows'), icon: GitBranch, description: 'Configure approval workflows and automation' },
        { name: 'User Roles', path: '/dashboard/roles', icon: Shield, description: 'Manage roles and role assignments' },
        { name: 'Access Policies', path: getProjectPath('/access-policies'), icon: Lock, description: 'Fine-grained permission management' },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { name: 'Settings', path: '/dashboard/settings', icon: Settings, description: 'General tenant configuration', isCurrent: true },
        { name: 'Appearance', path: '/dashboard/settings/appearance', icon: Palette, description: 'Theme and branding configuration' },
        { name: 'Bookmarks', path: '/dashboard/settings/bookmarks', icon: Bookmark, description: 'Save frequently accessed views and filters' },
        { name: 'Translations', path: getProjectPath('/locales'), icon: Languages, description: 'Multi-language content management' },
        { name: 'AI', path: '/dashboard/settings/ai', icon: Sparkles, description: 'AI configuration and settings' },
      ],
    },
    {
      title: 'Extensions',
      items: [
        { name: 'Marketplace', path: '/dashboard/settings/marketplace', icon: Store, description: 'Browse and install extensions, themes, schemas' },
        { name: 'Extensions', path: '/dashboard/settings/extensions', icon: Puzzle, description: 'Manage installed extensions and plugins' },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'System Logs', path: '/dashboard/settings/system-logs', icon: FileCode, description: 'View system activity and audit trails' },
        { name: 'Report Bug', path: '/dashboard/settings/report-bug', icon: Bug, description: 'Submit bug reports and issues' },
        { name: 'Request Feature', path: '/dashboard/settings/request-feature', icon: Lightbulb, description: 'Submit feature requests' },
      ],
    },
  ]

  return (
    <DashboardLayout basePath="/dashboard" title="Settings" subtitle="Configuration" icon={<Settings className="h-5 w-5" />}>
      <div className="flex-1 bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your tenant configuration and preferences</p>
          </div>

          <div className="space-y-6">
            {settingsSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {section.title}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link key={item.path} href={item.path}>
                        <Card className={`hover:border-primary transition-colors cursor-pointer ${item.isCurrent ? 'border-primary' : ''}`}>
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <CardTitle className="text-base">{item.name}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-sm">{item.description}</CardDescription>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
