import { useState } from 'react';
import { Search, Calendar as CalendarIcon, Filter, X, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { FilterState } from '@/lib/browseTypes';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FiltersToolbarProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  drivers: string[];
  showMapToggle?: boolean;
  isMapVisible?: boolean;
  onMapToggle?: () => void;
}

export function FiltersToolbar({
  filters,
  onFiltersChange,
  onClearFilters,
  drivers,
  showMapToggle,
  isMapVisible,
  onMapToggle,
}: FiltersToolbarProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.type !== 'all' ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.supir ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 p-4 border-b bg-card">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by No Surat Jalan..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Type Filter */}
        <Select
          value={filters.type}
          onValueChange={(value) => onFiltersChange({ type: value as FilterState['type'] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Pengiriman">Pengiriman</SelectItem>
            <SelectItem value="Pengembalian">Pengembalian</SelectItem>
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[160px] justify-start text-left font-normal',
                !filters.dateFrom && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom ? format(new Date(filters.dateFrom), 'MMM dd, yyyy') : 'From date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              onSelect={(date) => {
                onFiltersChange({ dateFrom: date?.toISOString().split('T')[0] });
                setDateFromOpen(false);
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[160px] justify-start text-left font-normal',
                !filters.dateTo && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo ? format(new Date(filters.dateTo), 'MMM dd, yyyy') : 'To date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onSelect={(date) => {
                onFiltersChange({ dateTo: date?.toISOString().split('T')[0] });
                setDateToOpen(false);
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Driver Filter */}
        <Select value={filters.supir || ''} onValueChange={(value) => onFiltersChange({ supir: value || undefined })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Drivers</SelectItem>
            {drivers.map((driver) => (
              <SelectItem key={driver} value={driver}>
                {driver}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}

        {/* Map Toggle */}
        {showMapToggle && (
          <Button
            variant={isMapVisible ? 'default' : 'outline'}
            size="sm"
            onClick={onMapToggle}
            className="ml-auto"
          >
            <MapIcon className="w-4 h-4 mr-1" />
            {isMapVisible ? 'Hide Map' : 'Show Map'}
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ search: '' })}
              />
            </Badge>
          )}
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.type}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ type: 'all' })}
              />
            </Badge>
          )}
          {filters.dateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {format(new Date(filters.dateFrom), 'MMM dd, yyyy')}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ dateFrom: undefined })}
              />
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {format(new Date(filters.dateTo), 'MMM dd, yyyy')}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ dateTo: undefined })}
              />
            </Badge>
          )}
          {filters.supir && (
            <Badge variant="secondary" className="gap-1">
              Driver: {filters.supir}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ supir: undefined })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
