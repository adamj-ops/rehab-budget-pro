"use client";

import Link from "next/link";
import { IconChartBar } from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { NavMain, NavSecondary } from "./nav-main";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <Link href="/" className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
                <IconChartBar className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold">Rehab Budget Pro</span>
                <span className="text-xs text-muted-foreground">Fix & Flip</span>
              </div>
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <NavMain />
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavSecondary />
            <div className="flex items-center justify-between px-2 py-2 group-data-[collapsible=icon]:justify-center">
              <ThemeToggle />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
