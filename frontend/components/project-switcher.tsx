'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, FolderKanban, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProject } from '@/contexts/project-context';
import { cn } from '@/lib/utils';

export function ProjectSwitcher() {
  const router = useRouter();
  const { currentProject, projects, loading, setCurrentProject } = useProject();
  const [open, setOpen] = useState(false);

  const handleSelectProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      setOpen(false);
    }
  };

  const handleCreateProject = () => {
    setOpen(false);
    router.push('/dashboard/settings/projects?action=create');
  };

  const handleManageProjects = () => {
    setOpen(false);
    router.push('/dashboard/settings/projects');
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-8">
        <FolderKanban className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!currentProject) {
    return (
      <Button variant="ghost" size="sm" onClick={handleManageProjects} className="h-8">
        <FolderKanban className="h-4 w-4 mr-2" />
        Select Project
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-8 justify-between min-w-[200px]"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FolderKanban className="h-4 w-4 shrink-0" />
            <span className="truncate">{currentProject.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px]" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Current Project
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Check className="h-4 w-4 shrink-0" />
            <span className="truncate font-medium">{currentProject.name}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Project
        </DropdownMenuLabel>
        {projects.length === 0 ? (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            No projects available
          </DropdownMenuItem>
        ) : (
          projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              className={cn(
                'cursor-pointer',
                project.id === currentProject.id && 'bg-accent'
              )}
              onClick={() => handleSelectProject(project.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {project.id === currentProject.id ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : (
                  <div className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{project.name}</span>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleCreateProject}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Project
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleManageProjects}
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Projects
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
