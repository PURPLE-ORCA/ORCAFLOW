import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ProjectSidebar } from '@/components/layout/ProjectSidebar';
import { ProjectHeader } from '@/components/layout/ProjectHeader';

export default async function ProjectLayout({ children, params }) {
  const { id } = await params;

  // Fetch project data
  let project = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/projects/${id}`, {
      cache: 'no-store', // Always fetch fresh data for layout
    });

    if (response.ok) {
      project = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch project:', error);
    // Continue with null project - components will handle loading state
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
        {/* Sidebar */}
        <div className="hidden md:block">
          <ProjectSidebar project={project} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <ProjectHeader project={project} />

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}