'use client';

import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconLayoutKanban,
  IconNotes,
  IconCalendarEvent,
  IconPlus,
  IconSettings,
  IconUsers
} from '@tabler/icons-react';

export function ProjectSidebar({ project, className }) {
  const { open } = useSidebar();
  const pathname = usePathname();
  const params = useParams();
  const projectId = params?.id;

  // Navigation items
  const navigationItems = [
    {
      href: `/projects/${projectId}/tasks`,
      label: 'Tasks',
      icon: <IconLayoutKanban className="w-5 h-5" />,
      isActive: pathname === `/projects/${projectId}/tasks`
    },
    {
      href: `/projects/${projectId}/notes`,
      label: 'Notes (soon)',
      icon: <IconNotes className="w-5 h-5" />,
      isActive: pathname === `/projects/${projectId}/notes`
    },
    {
      href: `/projects/${projectId}/meetings`,
      label: 'Meetings (soon)',
      icon: <IconCalendarEvent className="w-5 h-5" />,
      isActive: pathname === `/projects/${projectId}/meetings`
    }
  ];

  return (
    <SidebarBody className={cn('flex flex-col h-full', className)}>
      {/* Project Info Section */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className={cn(
              'font-semibold text-neutral-900 dark:text-neutral-100 truncate',
              !open && 'text-sm'
            )}>
              {project?.title || 'Loading...'}
            </h2>
            {open && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <IconUsers className="w-3 h-3 mr-1" />
                  X members
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 p-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                item.isActive
                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100'
                  : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-neutral-800'
              )}>
                {item.icon}
                {open && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Quick Actions Section */}
      {open && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
            >
              <IconPlus className="w-4 h-4 mr-2" />
              New Task (soon)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start"
            >
              <IconPlus className="w-4 h-4 mr-2" />
              New Note (soon)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start"
            >
              <IconPlus className="w-4 h-4 mr-2" />
              Schedule Meeting (soon)
            </Button>
          </div>

          {/* Project Settings */}
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Link href={`/projects/${projectId}/settings`}>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <IconSettings className="w-4 h-4" />
                <span>Settings (soon)</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </SidebarBody>
  );
}

export default ProjectSidebar;