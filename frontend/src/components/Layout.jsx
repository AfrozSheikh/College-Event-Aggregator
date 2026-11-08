import React, { Suspense, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarPlus,
  Images,
  Users,
  FileText,
  ClipboardList,
  MessageSquare,
  FolderOpen,
  LogOut,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from '@/components/common/ThemeToggle';
import Brand from '@/components/common/Brand';
import { PageSkeleton } from '@/components/common/Loaders';
import { Avatar, AvatarFallback } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, getInitials } from '@/lib/utils';

const NAV = {
  admin: [
    { items: [{ name: 'Overview', path: '/admin', icon: LayoutDashboard }] },
    {
      section: 'Events',
      items: [
        { name: 'All events', path: '/events', icon: CalendarDays },
        { name: 'New event', path: '/create-event', icon: CalendarPlus },
        { name: 'Gallery', path: '/gallery', icon: Images },
      ],
    },
    {
      section: 'Admin',
      items: [
        { name: 'People', path: '/admin/users', icon: Users },
        { name: 'Reports', path: '/admin/reports', icon: FileText },
      ],
    },
  ],
  faculty: [
    { items: [{ name: 'Overview', path: '/faculty', icon: LayoutDashboard }] },
    {
      section: 'Events',
      items: [
        { name: 'All events', path: '/events', icon: CalendarDays },
        { name: 'My events', path: '/faculty/my-events', icon: FolderOpen },
        { name: 'New event', path: '/create-event', icon: CalendarPlus },
        { name: 'Gallery', path: '/gallery', icon: Images },
      ],
    },
  ],
  student: [
    { items: [{ name: 'Overview', path: '/student', icon: LayoutDashboard }] },
    {
      section: 'Events',
      items: [
        { name: 'Browse events', path: '/events', icon: CalendarDays },
        { name: 'Gallery', path: '/gallery', icon: Images },
      ],
    },
    {
      section: 'Mine',
      items: [
        { name: 'Registrations', path: '/student/my-registrations', icon: ClipboardList },
        { name: 'Feedback', path: '/student/my-feedback', icon: MessageSquare },
      ],
    },
  ],
};

const NavList = ({ groups, pathname, onNavigate }) => (
  <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
    {groups.map((group, gi) => (
      <div key={group.section || gi}>
        {group.section && <p className="meta mb-1.5 px-3">{group.section}</p>}
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-md px-3 py-[7px] text-[14.5px] transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-foreground'
                )}
              >
                {isActive && <span className="bg-primary absolute top-2 bottom-2 -left-3 w-[3px] rounded-r" />}
                <item.icon className="size-4 opacity-80" strokeWidth={1.75} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    ))}
  </nav>
);

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const groups = NAV[user?.role] || [];

  const UserBlock = (
    <div className="border-sidebar-border flex items-center gap-3 border-t px-5 py-4">
      <Avatar className="size-8">
        <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">{user?.name}</p>
        <p className="meta truncate capitalize">{user?.role}</p>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={handleLogout} aria-label="Log out" className="text-muted-foreground">
        <LogOut />
      </Button>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r lg:flex">
        <div className="px-5 pt-5 pb-2">
          <Brand />
        </div>
        <NavList groups={groups} pathname={location.pathname} />
        {UserBlock}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="bg-sidebar w-72 gap-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
          <div className="px-5 pt-5 pb-2">
            <Brand />
          </div>
          <NavList groups={groups} pathname={location.pathname} onNavigate={() => setMobileOpen(false)} />
          {UserBlock}
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col lg:pl-60">
        <header className="bg-background/95 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 sm:px-6">
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
          <Brand compact className="lg:hidden" />

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:bg-accent ml-1 flex cursor-pointer items-center gap-2 rounded-md py-1 pr-1.5 pl-1 transition-colors outline-none">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-[12px]">{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[150px] truncate text-sm md:block">{user?.name}</span>
                  <ChevronDown className="text-muted-foreground hidden size-3.5 md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">{user?.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {groups[0]?.items[0] && (
                  <DropdownMenuItem onClick={() => navigate(groups[0].items[0].path)}>
                    <LayoutDashboard /> Overview
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/events')}>
                  <CalendarDays /> Events
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10"
          >
            <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
