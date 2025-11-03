import { Calendar, User, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface QuickFiltersProps {
  drivers: string[];
  dates: string[];
  types: Array<'Pengiriman' | 'Pengembalian'>;
  selectedDriver?: string;
  selectedDate?: string;
  selectedType?: string;
  onDriverSelect: (driver: string | undefined) => void;
  onDateSelect: (date: string | undefined) => void;
  onTypeSelect: (type: string | undefined) => void;
}

export function QuickFilters({
  drivers,
  dates,
  types,
  selectedDriver,
  selectedDate,
  selectedType,
  onDriverSelect,
  onDateSelect,
  onTypeSelect,
}: QuickFiltersProps) {
  return (
    <div className="border-t p-4 space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
          <User className="w-3 h-3" />
          Quick Filters
        </h3>
      </div>

      {/* Driver Filter */}
      <div>
        <div className="text-xs font-medium mb-2 text-foreground">Driver</div>
        <ScrollArea className="h-32">
          <div className="space-y-1">
            {drivers.slice(0, 10).map((driver) => (
              <Button
                key={driver}
                variant={selectedDriver === driver ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => onDriverSelect(selectedDriver === driver ? undefined : driver)}
              >
                {driver}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Type Filter */}
      <div>
        <div className="text-xs font-medium mb-2 text-foreground flex items-center gap-1">
          <FileType className="w-3 h-3" />
          Type
        </div>
        <div className="space-y-1">
          {types.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => onTypeSelect(selectedType === type ? undefined : type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Recent Dates */}
      <div>
        <div className="text-xs font-medium mb-2 text-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Recent Dates
        </div>
        <ScrollArea className="h-32">
          <div className="space-y-1">
            {dates.slice(0, 7).map((date) => (
              <Button
                key={date}
                variant={selectedDate === date ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => onDateSelect(selectedDate === date ? undefined : date)}
              >
                {format(new Date(date), 'PP')}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Active Filters */}
      {(selectedDriver || selectedDate || selectedType) && (
        <div>
          <div className="text-xs font-medium mb-2 text-foreground">Active</div>
          <div className="flex flex-wrap gap-1">
            {selectedDriver && (
              <Badge variant="secondary" className="text-xs">
                {selectedDriver}
              </Badge>
            )}
            {selectedType && (
              <Badge variant="secondary" className="text-xs">
                {selectedType}
              </Badge>
            )}
            {selectedDate && (
              <Badge variant="secondary" className="text-xs">
                {format(new Date(selectedDate), 'PP')}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
