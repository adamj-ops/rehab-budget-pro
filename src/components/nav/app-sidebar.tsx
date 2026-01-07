"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChartBar } from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain, NavSecondary } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AppSidebar() {
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  return (
    <>
      {/* Primary Sidebar - Main Navigation */}
      <Sidebar collapsible="none" className="border-r">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2 px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <IconChartBar className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Rehab Budget Pro</span>
              <span className="text-xs text-muted-foreground">Fix & Flip</span>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <NavMain
            projectsExpanded={projectsExpanded}
            onProjectsExpand={setProjectsExpanded}
          />
        </SidebarContent>

        <SidebarFooter>
          <NavSecondary />
          <div className="flex items-center justify-between px-2 py-2">
            <ThemeToggle />
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Secondary Sidebar - Projects Panel (collapsible) */}
      {projectsExpanded && <NavProjects />}
    </>
  );
}
