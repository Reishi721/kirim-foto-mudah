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
import type { DateRange } from 'react-day-picker';

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
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  // Helper function to format date without timezone conversion
  const formatDateLocal = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Helper function to convert Date to local date string
  const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Create DateRange object from filter state
  const dateRange: DateRange | undefined = 
    filters.dateFrom || filters.dateTo
      ? {
          from: filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00') : undefined,
          to: filters.dateTo ? new Date(filters.dateTo + 'T00:00:00') : undefined,
        }
      : undefined;

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
            placeholder="Search by Document No..."
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

        {/* Date Range Picker */}
        <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[280px] justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                  </>
                ) : (
                  format(dateRange.from, 'MMM dd, yyyy')
                )
              ) : (
                'Select date range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range: DateRange | undefined) => {
                if (range) {
                  onFiltersChange({
                    dateFrom: range.from ? toLocalDateString(range.from) : undefined,
                    dateTo: range.to ? toLocalDateString(range.to) : undefined,
                  });
                } else {
                  onFiltersChange({ dateFrom: undefined, dateTo: undefined });
                }
              }}
              numberOfMonths={2}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Driver Filter */}
        <Select 
          value={filters.supir || 'all'} 
          onValueChange={(value) => onFiltersChange({ supir: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
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
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="gap-1">
              Date: {filters.dateFrom && format(new Date(filters.dateFrom + 'T00:00:00'), 'MMM dd, yyyy')}
              {filters.dateFrom && filters.dateTo && ' - '}
              {filters.dateTo && format(new Date(filters.dateTo + 'T00:00:00'), 'MMM dd, yyyy')}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ dateFrom: undefined, dateTo: undefined })}
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
