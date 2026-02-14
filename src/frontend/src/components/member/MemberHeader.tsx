import { useMemberAuth } from '../../hooks/useMemberAuth';
import { useGetMemberProfile } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';

export default function MemberHeader() {
  const { memberId, logout } = useMemberAuth();
  const { data: memberProfile } = useGetMemberProfile(memberId || undefined);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const initials = memberProfile?.name
    ? memberProfile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'M';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 md:gap-3">
          <img 
            src="/assets/generated/rawfit-gym-logo-transparent.dim_200x200.png" 
            alt="RawFit Gym Logo" 
            className="h-8 w-8 md:h-10 md:w-10 object-contain"
          />
          <div>
            <h1 className="text-base md:text-xl font-bold">RawFit Gym</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Think Fit, Be Fit</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full">
              <Avatar className="h-8 w-8 md:h-10 md:w-10">
                <AvatarImage src="/assets/generated/default-avatar-transparent.dim_100x100.png" alt={memberProfile?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{memberProfile?.name || 'Member'}</p>
                <p className="text-xs leading-none text-muted-foreground">ID: {memberId}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
