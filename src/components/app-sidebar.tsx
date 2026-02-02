"use client"

import * as React from "react"
import {
  FileTextIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  PlusCircleIcon,
} from "lucide-react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "New Assessment",
      url: "/dashboard/create",
      icon: PlusCircleIcon,
    },
    {
      title: "Docs",
      url: "/docs",
      icon: FileTextIcon,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoyIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  // Simplified user object for NavUser
  const navUser = user ? {
    name: user.name || "Guest User",
    email: user.email || "guest@example.com",
    avatar: "",
  } : {
    name: "Guest",
    email: "",
    avatar: ""
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="bg-[var(--light-cream)]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LayoutDashboardIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">C2L Migration</span>
                  <span className="truncate text-xs">Assessment Tool</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-[var(--light-cream)]">
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="bg-[var(--light-cream)]">
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
