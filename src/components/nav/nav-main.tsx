"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconFolders,
  IconUsers,
  IconBook,
  IconSettings,
  IconChevronRight,
} from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface NavMainProps {
  onProjectsExpand?: (expanded: boolean) => void;
  projectsExpanded?: boolean;
}

const mainNavItems = [
  {
    title: "Home",
    href: "/",
    icon: IconHome,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: IconFolders,
    hasSubmenu: true,
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

export function NavMain({ onProjectsExpand, projectsExpanded }: NavMainProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {mainNavItems.map((item) => {
            const active = isActive(item.href);

            if (item.hasSubmenu) {
              return (
                <Collapsible
                  key={item.title}
                  open={projectsExpanded}
                  onOpenChange={onProjectsExpand}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className="justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </span>
                        <IconChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            projectsExpanded && "rotate-90"
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {/* Projects submenu items rendered by parent */}
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

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
