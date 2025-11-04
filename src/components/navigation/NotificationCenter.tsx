import { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Global notifications state - can be accessed from anywhere
let notificationsState: Notification[] = [];
let listeners: Array<(notifications: Notification[]) => void> = [];

export const notificationService = {
  add: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };
    notificationsState = [newNotification, ...notificationsState];
    listeners.forEach(listener => listener(notificationsState));
  },
  
  markAsRead: (id: string) => {
    notificationsState = notificationsState.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    listeners.forEach(listener => listener(notificationsState));
  },
  
  remove: (id: string) => {
    notificationsState = notificationsState.filter(n => n.id !== id);
    listeners.forEach(listener => listener(notificationsState));
  },
  
  clearAll: () => {
    notificationsState = [];
    listeners.forEach(listener => listener(notificationsState));
  },

  subscribe: (listener: (notifications: Notification[]) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return notificationService.subscribe(setNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-brand" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      notificationService.markAsRead(notification.id);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 md:w-96 p-0 bg-popover backdrop-blur-xl border border-border z-50" 
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => notificationService.clearAll()}
              className="text-xs h-8"
            >
              Clear all
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`border-b last:border-b-0 ${
                    !notification.read ? 'bg-muted/30' : ''
                  }`}
                >
                  <div
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              notificationService.remove(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(notification.timestamp, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
