import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Upload, FolderOpen, LogOut, Home, Map, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import scaffoldingLogo from '@/assets/scaffolding-logo.png';
import { UserProfileDropdown } from './navigation/UserProfileDropdown';
import { GlobalSearch } from './navigation/GlobalSearch';
import { NotificationCenter } from './navigation/NotificationCenter';
import { GPSIndicator } from './navigation/GPSIndicator';
import { Separator } from './ui/separator';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    setIsOpen(false);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/browse', icon: FolderOpen, label: 'Browse' },
    { path: '/map', icon: Map, label: 'Map' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={scaffoldingLogo} alt="Logo" className="h-8 md:h-10 w-auto" />
            <span className="font-semibold text-sm md:text-lg text-foreground hidden sm:inline">
              Documenting System
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={active ? 'default' : 'ghost'}
                    size="sm"
                    className={`gap-2 relative ${
                      active 
                        ? 'bg-brand text-primary-foreground shadow-md' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {active && (
                      <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary-foreground rounded-full" />
                    )}
                  </Button>
                </Link>
              );
            })}
            
            <Separator orientation="vertical" className="h-6 mx-2" />
            
            <GPSIndicator />
            <GlobalSearch />
            <NotificationCenter />
            <UserProfileDropdown />
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <GlobalSearch />
            <NotificationCenter />
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 sm:w-80 bg-card/95 backdrop-blur-xl">
                <div className="flex flex-col gap-2 mt-8">
                  {/* User Profile Section */}
                  <div className="mb-4 p-4 rounded-lg bg-muted/30 border border-border flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/20">
                      <span className="text-lg font-semibold text-brand">
                        {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{userEmail || 'User'}</p>
                      <p className="text-xs text-muted-foreground">View Profile</p>
                    </div>
                  </div>

                  <Separator className="mb-2" />

                  {/* Navigation Items */}
                  {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                        <Button
                          variant={active ? 'default' : 'ghost'}
                          size="lg"
                          className={`w-full justify-start gap-3 min-h-[52px] text-base ${
                            active 
                              ? 'bg-brand text-primary-foreground shadow-md font-semibold' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span>{item.label}</span>
                          {active && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                          )}
                        </Button>
                      </Link>
                    );
                  })}
                  
                  <Separator className="my-2" />
                  
                  <Button 
                    variant="ghost"
                    size="lg" 
                    onClick={handleLogout} 
                    className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[52px] text-base"
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
