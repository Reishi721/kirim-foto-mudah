import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Upload, FolderOpen, LogOut, Truck, Home, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
  };

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <span className="font-semibold text-lg text-foreground">Documenting File System</span>
            </button>

            <div className="flex items-center gap-2">
              <Link to="/">
                <Button
                  variant={location.pathname === '/' ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>
              </Link>
              <Link to="/upload">
                <Button
                  variant={location.pathname === '/upload' ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </Link>
              <Link to="/browse">
                <Button
                  variant={location.pathname === '/browse' ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  Browse
                </Button>
              </Link>
              <Link to="/map">
                <Button
                  variant={location.pathname === '/map' ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Map className="w-4 h-4" />
                  Map
                </Button>
              </Link>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
