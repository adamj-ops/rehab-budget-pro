"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  IconHome,
  IconPlus,
  IconFolders,
  IconUsers,
  IconBook,
  IconSettings,
  IconChevronRight,
  IconLayoutKanban,
  IconCalendarEvent,
  IconNotebook,
  IconTemplate,
} from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Project } from "@/types";

const mainNavItems = [
  {
    title: "Pipeline",
    href: "/pipeline",
    icon: IconLayoutKanban,
  },
  {
    title: "Timeline",
    href: "/timeline",
    icon: IconCalendarEvent,
  },
  {
    title: "Templates",
    href: "/templates",
    icon: IconTemplate,
  },
  {
    title: "Journal",
    href: "/journal",
    icon: IconNotebook,
  },
  {
    title: "Vendors",
    href: "/vendors",
    icon: IconUsers,
  },
  {
    title: "Cost Reference",
    href: "/cost-reference",
    icon: IconBook,
  },
];

export function NavMain() {
  const pathname = usePathname();

  const { data: projects } = useQuery({
    queryKey: ["projects-nav"],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, address, city")
        .order("updated_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as Pick<Project, "id" | "name" | "address" | "city">[];
    },
    staleTime: 30000,
  });

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const isProjectsActive = pathname.startsWith("/projects");

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* New Project (quick action) */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={false}
              tooltip="New Project"
              variant="outline"
              size="sm"
              className="border-dashed"
            >
              <Link href="/projects/new">
                <IconPlus className="h-4 w-4" />
                <span>New Project</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Home */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/")} tooltip="Home">
              <Link href="/">
                <IconHome className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Projects with Dropdown */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  isActive={isProjectsActive}
                  tooltip="Projects"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <IconFolders className="h-4 w-4" />
                    <span>Projects</span>
                  </span>
                  <IconChevronRight className="h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="start"
                className="w-64"
                sideOffset={8}
              >
                {projects && projects.length > 0 ? (
                  <>
                    {projects.map((project) => (
                      <DropdownMenuItem key={project.id} asChild>
                        <Link
                          href={`/projects/${project.id}`}
                          className="flex flex-col items-start gap-0.5"
                        >
                          <span className="font-medium truncate w-full">
                            {project.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate w-full">
                            {project.address || "No address"}
                            {project.city && `, ${project.city}`}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/projects" className="font-medium">
                        Show all projects →
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/projects" className="font-medium">
                      View all projects →
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* Other nav items */}
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function NavSecondary() {
  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <IconSettings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
