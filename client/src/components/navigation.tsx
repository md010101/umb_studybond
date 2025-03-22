import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Users } from "lucide-react";
import { NotificationPopover } from "./notification-popover";

export function Navigation() {
  const { user, logout } = useUser();

  if (!user) return null;

  const initials = user.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.username[0].toUpperCase();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <div className="font-bold text-2xl bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">
              <Link href="/">sesh</Link>
            </div>
            <div className="text-xs text-muted-foreground -mt-1">
              Connect with other students for collaborative study sessions
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/matches">
              <Button variant="ghost">
                <Users className="w-4 h-4 mr-2" />
                Matches
              </Button>
            </Link>
            <Link href="/matches">
              <Button variant="ghost">
                <MessageCircle className="w-4 h-4 mr-2" />
                Active Sessions
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <NotificationPopover />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => logout()}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}