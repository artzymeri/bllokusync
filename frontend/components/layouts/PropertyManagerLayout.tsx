"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Users,
  ClipboardList,
  LogOut,
  Menu,
  Settings,
  ChevronUp,
  Settings as SettingsIcon,
  FileText,
  MessageSquare,
  Lightbulb,
  Euro,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { usePropertyManagerSidebarCounts } from "@/hooks/usePropertyManagerSidebarCounts";

const propertyManagerNavItems = [
  { href: "/property_manager", icon: ClipboardList, label: "Paneli" },
  { href: "/property_manager/properties", icon: Building2, label: "Pronat" },
  { href: "/property_manager/tenants", icon: Users, label: "Banorët" },
  { href: "/property_manager/payments", icon: Euro, label: "Pagesat" },
  { href: "/property_manager/monthly-reports", icon: BarChart3, label: "Raportet Mujore" },
  { href: "/property_manager/reports", icon: FileText, label: "Raportimet" },
  { href: "/property_manager/complaints", icon: MessageSquare, label: "Ankesat" },
  { href: "/property_manager/suggestions", icon: Lightbulb, label: "Sugjerimet" },
  { href: "/property_manager/configurations", icon: SettingsIcon, label: "Konfigurimet" },
];

// Helper function to get page title
const getPageTitle = (pathname: string) => {
  const navItem = propertyManagerNavItems.find((item) => item.href === pathname);
  if (navItem) return navItem.label;

  // For nested routes
  if (pathname.startsWith("/property_manager/properties")) return "Pronat";
  if (pathname.startsWith("/property_manager/tenants")) return "Banorët";
  if (pathname.startsWith("/property_manager/payments")) return "Pagesat";
  if (pathname.startsWith("/property_manager/monthly-reports")) return "Raportet Mujore";
  if (pathname.startsWith("/property_manager/reports")) return "Raportimet";
  if (pathname.startsWith("/property_manager/complaints")) return "Ankesat";
  if (pathname.startsWith("/property_manager/suggestions")) return "Sugjerimet";
  if (pathname.startsWith("/property_manager/configurations")) return "Konfigurimet";

  return "Paneli i Menaxherit";
};

export function PropertyManagerLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  // Fetch sidebar badge counts
  const { data: sidebarCounts } = usePropertyManagerSidebarCounts();

  const handleLogout = async () => {
    await logout();
  };

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-indigo-900 to-indigo-800 text-slate-50">
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-3 border-b border-indigo-700 px-3 md:px-4">
        <div className="flex items-center gap-2">
          <Image src="/favicon.svg" alt="BllokuSync" width={140} height={35} className="h-6 md:h-8 w-auto brightness-200" style={{filter: 'brightness(1000%)'}} priority />
          <h3 className="text-sm md:text-base">BllokuSync</h3>
        </div>
        <Badge variant="secondary" className="ml-auto bg-amber-500 text-slate-900 text-xs">
          Menaxher
        </Badge>
      </div>
      <ScrollArea className="flex-1 px-2 md:px-3 py-3 md:py-4">
        <nav className="space-y-1 md:space-y-2">
          {propertyManagerNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            // Determine if badge should be shown
            let badgeCount = 0;
            if (item.href === '/property_manager/reports' && sidebarCounts?.pendingReports) {
              badgeCount = sidebarCounts.pendingReports;
            } else if (item.href === '/property_manager/complaints' && sidebarCounts?.pendingComplaints) {
              badgeCount = sidebarCounts.pendingComplaints;
            } else if (item.href === '/property_manager/suggestions' && sidebarCounts?.pendingSuggestions) {
              badgeCount = sidebarCounts.pendingSuggestions;
            }

            const showBadge = badgeCount > 0;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-2 md:gap-3 h-10 md:h-11 text-sm md:text-base ${
                    isActive
                      ? "bg-amber-500 text-slate-900 hover:bg-amber-600"
                      : "text-slate-300 hover:bg-indigo-700 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {showBadge && (
                    <Badge
                      className={`ml-auto h-5 min-w-5 px-1.5 text-xs font-semibold flex-shrink-0 ${
                        isActive
                          ? "bg-indigo-800 text-slate-50 hover:bg-indigo-800"
                          : "bg-amber-500 text-slate-900 hover:bg-amber-500"
                      }`}
                    >
                      {badgeCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator className="bg-indigo-700" />
      <div className="p-3 md:p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 md:gap-3 rounded-lg bg-indigo-700/50 px-2 md:px-3 py-4 md:py-6 hover:bg-indigo-700"
            >
              <Avatar className="h-8 w-8 md:h-10 md:w-10">
                <AvatarFallback className="bg-amber-500 text-slate-900 text-xs md:text-sm">
                  {user?.name?.[0]}
                  {user?.surname?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-xs md:text-sm font-medium truncate">
                  {user?.name} {user?.surname}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuLabel>Llogaria e Menaxherit</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Cilësimet e Profilit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Dil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const pageTitle = title || getPageTitle(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 lg:w-64 border-r border-slate-200 lg:block">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 md:h-16 items-center gap-3 md:gap-4 border-b border-slate-200 bg-white px-4 md:px-6 shadow-sm">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
              <Sidebar />
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 truncate">
              {pageTitle}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-indigo-50/30 p-3 md:p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
