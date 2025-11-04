import { useState, useEffect } from 'react';
import { Search, FileText, Image, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  no_surat_jalan: string;
  customer_name?: string;
  supir: string;
  tipe: string;
  tanggal: string;
  file_count: number;
  folder_path: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    const searchDocuments = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('upload_records')
          .select('*')
          .or(`no_surat_jalan.ilike.%${query}%,customer_name.ilike.%${query}%,supir.ilike.%${query}%,description.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchDocuments, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    // Navigate to browse page with the specific folder
    navigate(`/browse?path=${encodeURIComponent(result.folder_path)}`);
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 md:w-64 md:justify-start md:px-3 md:py-2 text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline-block">Search documents...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search by document number, customer, or driver..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {!isLoading && query.length >= 2 && (
            <>
              <CommandEmpty>No documents found.</CommandEmpty>
              <CommandGroup heading="Documents">
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-start gap-3 py-3"
                  >
                    <FileText className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {result.no_surat_jalan}
                        </p>
                        <Badge variant={result.tipe === 'Pengiriman' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                          {result.tipe}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {result.customer_name && (
                          <span className="truncate">{result.customer_name}</span>
                        )}
                        <span>•</span>
                        <span className="truncate">{result.supir}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Image className="h-3 w-3" />
                          {result.file_count}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(result.tanggal), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
