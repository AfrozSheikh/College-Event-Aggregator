import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, BellRing, ArrowRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const units = [
    ['y', 31536000],
    ['mo', 2592000],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
  ];
  for (const [label, secs] of units) {
    const v = Math.floor(seconds / secs);
    if (v >= 1) return `${v}${label} ago`;
  }
  return 'just now';
};

const NotificationBell = () => {
  const { user, notifications } = useAuth();
  const [open, setOpen] = useState(false);
  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  if (user?.role !== 'student') return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
          {unreadCount > 0 ? <BellRing className="size-[18px]" strokeWidth={1.75} /> : <Bell className="size-[18px]" strokeWidth={1.75} />}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-primary text-primary-foreground ring-background absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] ring-2"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-base">Notifications</h3>
            <p className="text-muted-foreground text-xs">{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}</p>
          </div>
        </div>

        <div className="scrollbar-thin max-h-96 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-serif text-lg">Nothing new</p>
              <p className="text-muted-foreground mt-1 text-xs">You'll see new events announced here</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'hover:bg-muted/60 flex gap-3 border-b px-4 py-3 transition-colors last:border-0',
                  !notification.is_read && 'bg-accent/50'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm leading-snug', !notification.is_read ? 'font-semibold' : 'font-medium')}>
                      {notification.title}
                    </p>
                    {!notification.is_read && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />}
                  </div>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{notification.message}</p>
                  <p className="text-muted-foreground/70 mt-1 text-[11px]">{timeAgo(notification.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-muted/40 border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/student/my-registrations" onClick={() => setOpen(false)}>
              See my registrations <ArrowRight />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
