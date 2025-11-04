import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BreadcrumbPath {
  name: string;
  path: string;
}

interface BreadcrumbNavProps {
  paths: BreadcrumbPath[];
  onNavigate: (path: string | null) => void;
}

export function BreadcrumbNav({ paths, onNavigate }: BreadcrumbNavProps) {
  // On mobile, show only last 2 items with dropdown for the rest
  const isMobile = paths.length > 3;
  const visiblePaths = isMobile ? paths.slice(-2) : paths;
  const hiddenPaths = isMobile ? paths.slice(0, -2) : [];

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="shrink-0 h-8"
      >
        <Home className="h-4 w-4" />
      </Button>

      {hiddenPaths.length > 0 && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover backdrop-blur-sm z-50">
              {hiddenPaths.map((item, idx) => (
                <DropdownMenuItem
                  key={idx}
                  onClick={() => onNavigate(item.path)}
                  className="cursor-pointer"
                >
                  {item.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      {visiblePaths.map((item, index) => (
        <div key={index} className="flex items-center gap-2 shrink-0">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {index === visiblePaths.length - 1 ? (
            <span className="text-sm font-medium truncate max-w-[150px]">
              {item.name}
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(item.path)}
              className="h-8 truncate max-w-[150px]"
            >
              {item.name}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
