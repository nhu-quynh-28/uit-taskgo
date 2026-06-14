import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Bell, Moon, Sun, LogOut, User, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { topbarNotifications } from "@/lib/mock-data";
import { setAuthToken } from "@/lib/api/client";

const THEME_KEY = "taskgo_admin_theme";

function readInitialDark(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function Topbar() {
  const [dark, setDark] = useState(readInitialDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 border-b bg-background/80 backdrop-blur flex items-center gap-2 sm:gap-3 px-3 sm:px-4">
      <SidebarTrigger className="rounded-xl shrink-0" />
      <div className="relative flex-1 min-w-0 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search customers, taskers, orders…"
          className="pl-9 rounded-full bg-muted/50 border-transparent focus-visible:bg-background w-full"
        />
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setDark((v) => !v)}
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {topbarNotifications.length === 0 ? (
              <DropdownMenuItem disabled className="text-muted-foreground">
                No notifications
              </DropdownMenuItem>
            ) : (
              topbarNotifications.map((n) => (
                <DropdownMenuItem key={n.title} className="flex-col items-start py-3 rounded-xl">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full hover:bg-muted/60 pr-2 sm:pr-3 pl-1 py-1 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-sm font-semibold">Sara Admin</div>
                <div className="text-xs text-muted-foreground">Super Admin</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl"><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl">
              <Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className="rounded-xl text-destructive focus:text-destructive"
              onClick={() => setAuthToken(null)}
            >
              <Link to="/login"><LogOut className="mr-2 h-4 w-4" />Sign out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
