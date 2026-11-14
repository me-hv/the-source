"use client";

import * as React from "react";
import { logoutAction } from "@/features/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

interface UserNavProps {
  displayName?: string | null;
  avatarUrl?: string | null;
  workspaceName?: string;
}

export function UserNav({ displayName, avatarUrl, workspaceName }: UserNavProps) {
  const [isLoggingOut, startTransition] = React.useTransition();

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CR";

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-md p-1 outline-none transition-colors hover:bg-secondary focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="User profile menu"
        >
          <Avatar className="h-7 w-7 border-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName || "User"} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-medium leading-none text-foreground">
              {displayName || "Creative Mind"}
            </p>
            <p className="text-[11px] leading-none text-muted-foreground">
              {workspaceName || "Personal Studio"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-muted-foreground opacity-60">
          <User className="mr-2 h-3.5 w-3.5" />
          <span>Profile Settings (Coming Soon)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-xs text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          <span>{isLoggingOut ? "Signing out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
