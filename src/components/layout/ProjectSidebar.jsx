"use client";

import React from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconLayoutKanban,
  IconNotes,
  IconCalendarEvent,
  IconPlus,
  IconSettings,
  IconUsers,
  IconLogout,
} from "@tabler/icons-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/AuthContext";
import Image from "next/image";

export function ProjectSidebar({ project, className }) {
  const { open } = useSidebar();
  const pathname = usePathname();
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Debug logging to validate assumptions
  console.log("ProjectSidebar Debug - Auth context:", {
    user,
    signOut: typeof signOut,
  });

  // Navigation items
  const navigationItems = [
    {
      href: `/projects/${projectId}/tasks`,
      label: "Tasks",
      icon: <IconLayoutKanban className="w-5 h-5" />,
      isActive: pathname === `/projects/${projectId}/tasks`,
    },
    // {
    //   href: `/projects/${projectId}/notes`,
    //   label: 'Notes (soon)',
    //   icon: <IconNotes className="w-5 h-5" />,
    //   isActive: pathname === `/projects/${projectId}/notes`
    // },
    // {
    //   href: `/projects/${projectId}/meetings`,
    //   label: 'Meetings (soon)',
    //   icon: <IconCalendarEvent className="w-5 h-5" />,
    //   isActive: pathname === `/projects/${projectId}/meetings`
    // }
  ];

  return (
    <SidebarBody className={cn("flex flex-col h-full", className)}>
      {/* Project Info Section */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <Link href="/">
              <div className={cn("flex items-center justify-center", !open && "justify-center")}>
                <Image
                  src="/img/orcaLogo.png"
                  alt="ORCAFLOW Logo"
                  width={open ? 40 : 32}
                  height={open ? 40 : 32}
                  className={cn(
                    "object-contain transition-all duration-200 cursor-pointer hover:opacity-80",
                    !open && "w-10 h-10"
                  )}
                />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="p-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.isActive
                    ? "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100"
                    : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                {item.icon}
                {open && <span className="truncate">{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Quick Actions Section */}
      {open && (
        <div className="p-4 border-t flex-2 border-neutral-200 dark:border-neutral-700">
          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full justify-start text-muted-foreground bg-purple-600 hover:bg-purple-700"
            >
              <IconPlus className="w-4 h-4 mr-2" />
              New Task (soon)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start text-muted-foreground"
            >
              <IconPlus className="w-4 h-4 mr-2" />
              New Note (soon)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start text-muted-foreground"
            >
              <IconPlus className="w-4 h-4 mr-2" />
              Schedule Meeting (soon)
            </Button>
          </div>
        </div>
      )}

      {/* Account Menu */}
      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start p-2 h-auto hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={user?.avatar_url || ""}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback>
                    {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">

                  <div className="text-xs text-foreground truncate">
                    {user?.email || ""}
                  </div>
                </div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            className="w-80 mb-2 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              <button
                className="w-full text-left px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                disabled
              >
                <IconSettings className="w-4 h-4" />
                Settings (soon)
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                onClick={async () => {
                  console.log("ProjectSidebar Debug - signOut called");
                  await signOut();
                  router.push("/auth/signin");
                }}
              >
                <IconLogout className="w-4 h-4" />
                Log out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </SidebarBody>
  );
}

export default ProjectSidebar;
