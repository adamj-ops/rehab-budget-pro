"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  IconPlus,
  IconSearch,
  IconHome,
  IconHammer,
  IconFileDescription,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Project, ProjectStatus } from "@/types";
import { PROJECT_STATUS_LABELS } from "@/types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";

const statusGroups: { status: ProjectStatus; icon: typeof IconHammer; label: string }[] = [
  { status: "in_rehab", icon: IconHammer, label: "In Rehab" },
  { status: "under_contract", icon: IconFileDescription, label: "Under Contract" },
  { status: "analyzing", icon: IconSearch, label: "Analyzing" },
  { status: "listed", icon: IconHome, label: "Listed" },
  { status: "sold", icon: IconCheck, label: "Sold" },
  { status: "dead", icon: IconX, label: "Dead" },
];

export function NavProjects() {
  const params = useParams();
  const pathname = usePathname();
  const currentProjectId = params?.id as string | undefined;
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects-nav"],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, address, city, status")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Pick<Project, "id" | "name" | "address" | "city" | "status">[];
    },
    staleTime: 30000, // 30 seconds
  });

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return projects;

    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const projectsByStatus = useMemo(() => {
    const grouped: Record<ProjectStatus, typeof filteredProjects> = {
      lead: [],
      analyzing: [],
      under_contract: [],
      in_rehab: [],
      listed: [],
      sold: [],
      dead: [],
    };

    filteredProjects.forEach((project) => {
      grouped[project.status as ProjectStatus].push(project);
    });

    return grouped;
  }, [filteredProjects]);

  const recentProjects = useMemo(() => {
    return filteredProjects.slice(0, 5);
  }, [filteredProjects]);

  return (
    <Sidebar 
      collapsible="none" 
      className="border-r bg-sidebar/50 fixed left-[var(--sidebar-width)] top-0 z-20 shadow-lg"
    >
      <SidebarHeader className="gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Projects</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <Link href="/projects/new">
              <IconPlus className="h-4 w-4" />
              <span className="sr-only">New Project</span>
            </Link>
          </Button>
        </div>
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <SidebarInput
            placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="space-y-2 px-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {/* Recent Projects */}
            {!searchQuery && recentProjects.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Recent</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {recentProjects.map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={currentProjectId === project.id}
                          className="h-auto py-2"
                        >
                          <Link href={`/projects/${project.id}`}>
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="font-medium truncate max-w-[180px]">
                                {project.name}
                              </span>
                              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {project.address || "No address"}
                              </span>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <SidebarSeparator />

            {/* Projects by Status */}
            {statusGroups.map(({ status, icon: Icon, label }) => {
              const statusProjects = projectsByStatus[status];
              if (statusProjects.length === 0) return null;

              return (
                <SidebarGroup key={status}>
                  <SidebarGroupLabel className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    <SidebarMenuBadge className="static ml-auto">
                      {statusProjects.length}
                    </SidebarMenuBadge>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {statusProjects.map((project) => (
                        <SidebarMenuItem key={project.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={currentProjectId === project.id}
                            size="sm"
                          >
                            <Link href={`/projects/${project.id}`}>
                              <span className="truncate">{project.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}

            {filteredProjects.length === 0 && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No projects found" : "No projects yet"}
                    </p>
                    {!searchQuery && (
                      <Button variant="link" size="sm" className="mt-2" asChild>
                        <Link href="/projects/new">Create your first project</Link>
                      </Button>
                    )}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
