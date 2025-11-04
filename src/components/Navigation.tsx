import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Upload, FolderOpen, LogOut, Home, Map, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import scaffoldingLogo from '@/assets/scaffolding-logo.png';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <nav className="border-b bg-card sticky top-0 z-50 shadow-sm">
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
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-11 w-11">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:w-80">
              <div className="flex flex-col gap-3 mt-8">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                    <Button
                      variant={location.pathname === item.path ? 'default' : 'ghost'}
                      size="lg"
                      className="w-full justify-start gap-3 min-h-[52px] text-base"
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
                <Button 
                  variant="ghost"
                  size="lg" 
                  onClick={handleLogout} 
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive min-h-[52px] text-base"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
