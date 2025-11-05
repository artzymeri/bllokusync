"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  MessageSquare,
  Bell,
  LogOut,
  Menu,
  Settings,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  Euro,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const tenantNavItems = [
  { href: "/tenant", icon: Home, label: "Paneli Kryesor" },
  { href: "/tenant/payments", icon: Euro, label: "Pagesat e Mia" },
  { href: "/tenant/report-problem", icon: AlertTriangle, label: "Raportimet" },
  { href: "/tenant/complaints", icon: MessageSquare, label: "Ankesat" },
  { href: "/tenant/suggestions", icon: Lightbulb, label: "Sugjerimet" },
  { href: "/tenant/monthly-reports", icon: FileText, label: "Raportet Mujore" },
];

export function TenantLayout({ children, title = "My Apartment" }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const Sidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col bg-gradient-to-b from-emerald-700 to-emerald-600 text-slate-50">
      <div className="flex h-16 items-center gap-3 border-b border-emerald-600 px-4">
        <div className="flex items-center gap-2">
          <Image src="/favicon.svg" alt="BllokuSync" width={140} height={35} className="h-8 w-auto brightness-200" style={{filter: 'brightness(1000%)'}} priority />
          <h3 className="text-sm sm:text-base">BllokuSync</h3>
        </div>
        <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-800 text-xs">
          Tenant
        </Badge>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {tenantNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => isMobile && setMobileMenuOpen(false)}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-11 ${
                    isActive
                      ? "bg-white text-emerald-700 hover:bg-emerald-50"
                      : "text-emerald-50 hover:bg-emerald-600 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator className="bg-emerald-600" />
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-lg bg-emerald-600/50 px-3 py-6 hover:bg-emerald-600"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src="/tenant-avatar.jpg" />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                  {user?.name?.[0]}
                  {user?.surname?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-sm font-medium truncate">
                  {user?.name} {user?.surname}
                </p>
                <p className="text-xs text-emerald-100 truncate">{user?.email}</p>
              </div>
              <ChevronUp className="h-4 w-4 text-emerald-100 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuLabel>Llogaria Ime</DropdownMenuLabel>
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
              Dilni
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-slate-200 lg:block">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 sm:h-16 items-center gap-3 sm:gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 sm:h-10 sm:w-10">
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
              <Sidebar isMobile={true} />
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
              {title}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-emerald-50/20 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
