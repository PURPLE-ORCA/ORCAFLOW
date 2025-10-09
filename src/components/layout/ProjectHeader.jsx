'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

import {
  IconEdit,
  IconSettings,
  IconShare,
  IconDotsVertical,
  IconUsers,
  IconCalendar,
  IconArchive
} from '@tabler/icons-react';
import { Bell } from 'lucide-react';
import InviteForm from '../forms/InviteForm';
import UserInvitations from './UserInvitations';

export function ProjectHeader({ project, className }) {
   const pathname = usePathname();
   const params = useParams();
   const projectId = params?.id;

   // State for member count
   const [memberCount, setMemberCount] = useState(null);

   // Fetch member count when component mounts or projectId changes
   useEffect(() => {
     const fetchMemberCount = async () => {
       if (!projectId) return;

       try {
         const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
         const response = await fetch(`${baseUrl}/api/projects/${projectId}/members`, {
           cache: 'no-store',
         });

         if (response.ok) {
           const data = await response.json();
           setMemberCount(data.members?.length || 0);
         } else {
           console.error('Failed to fetch member count');
           setMemberCount(0);
         }
       } catch (error) {
         console.error('Error fetching member count:', error);
         setMemberCount(0);
       }
     };

     fetchMemberCount();
   }, [projectId]);

   // Generate breadcrumb items based on current path
   const getBreadcrumbItems = () => {
    const items = [
      { label: 'Projects', href: '/projects' }
    ];

    if (project?.title) {
      items.push({ label: project.title, href: `/projects/${projectId}` });
    }

    // Add current page based on pathname
    if (pathname.includes('/tasks')) {
      items.push({ label: 'Tasks', isCurrentPage: true });
    } else if (pathname.includes('/notes')) {
      items.push({ label: 'Notes', isCurrentPage: true });
    } else if (pathname.includes('/meetings')) {
      items.push({ label: 'Meetings', isCurrentPage: true });
    } else if (pathname === `/projects/${projectId}`) {
      items.push({ label: 'Overview', isCurrentPage: true });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-4 border-b border-[var(--main)] bg-background",
        className
      )}
    >
      {/* Left side - Breadcrumb */}
      <div className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {item.isCurrentPage ? (
                    <BreadcrumbPage className="font-semibold text-foreground">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={item.href}
                      className="text-foreground hover:text-muted-foreground"
                    >
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side - Project actions and info */}
      <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              <IconUsers className="w-3 h-3 mr-1" />
              {memberCount !== null ? `${memberCount} member${memberCount !== 1 ? 's' : ''}` : 'Loading...'}
            </Badge>
        {/* Theme toggler */}
        <AnimatedThemeToggler className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors" />

        {/* Notifications */}
        <UserInvitations />

        {/* Project actions */}
        <div className="flex items-center gap-2">
          <InviteForm
            projectId={projectId}
            trigger={
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <IconShare className="w-4 h-4 mr-2" />
                Share
              </Button>
            }
          />

          {/* <Button variant="outline" size="sm">
            <IconEdit className="w-4 h-4 mr-2" />
            Edit
          </Button> */}
        </div>
      </div>
    </div>
  );
}

export default ProjectHeader;