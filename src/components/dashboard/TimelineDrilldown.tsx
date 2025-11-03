import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight, FileText, MapPin, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { format } from 'date-fns';

interface TimelineDrilldownProps {
  uploads: any[];
}

interface TimelineGroup {
  date: string;
  count: number;
  uploads: any[];
}

export function TimelineDrilldown({ uploads }: TimelineDrilldownProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');

  const groupByDate = (): TimelineGroup[] => {
    const grouped = new Map<string, any[]>();

    uploads.forEach(upload => {
      let dateKey: string;
      const uploadDate = new Date(upload.created_at);

      switch(selectedPeriod) {
        case 'week':
          const weekStart = new Date(uploadDate);
          weekStart.setDate(uploadDate.getDate() - uploadDate.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          dateKey = `${uploadDate.getFullYear()}-${(uploadDate.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        default:
          dateKey = uploadDate.toISOString().split('T')[0];
      }

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(upload);
    });

    return Array.from(grouped.entries())
      .map(([date, uploads]) => ({
        date,
        count: uploads.length,
        uploads: uploads.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    switch(selectedPeriod) {
      case 'week':
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + 6);
        return `Week of ${format(date, 'MMM d')}`;
      case 'month':
        return format(date, 'MMMM yyyy');
      default:
        return format(date, 'EEEE, MMM d, yyyy');
    }
  };

  const timelineGroups = groupByDate();

  return (
    <Card className="relative overflow-hidden p-6">
      <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-from-l-brand to-success" />
      
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-semibold mb-2">Interactive Timeline</h2>
          <p className="text-sm text-muted-foreground">Drill down into delivery history</p>
        </div>
        
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map(period => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedPeriod(period);
                setExpandedDate(null);
              }}
              className="capitalize"
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {timelineGroups.map((group, index) => (
          <motion.div
            key={group.date}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedDate(expandedDate === group.date ? null : group.date)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand/10">
                  <Calendar className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="font-medium">{formatDateLabel(group.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.count} {group.count === 1 ? 'delivery' : 'deliveries'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{group.count}</Badge>
                <ChevronRight className={`h-4 w-4 transition-transform ${
                  expandedDate === group.date ? 'rotate-90' : ''
                }`} />
              </div>
            </button>

            <AnimatePresence>
              {expandedDate === group.date && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border bg-muted/20"
                >
                  <div className="p-4 space-y-3">
                    {group.uploads.map((upload, idx) => (
                      <div
                        key={upload.id}
                        className="p-3 rounded-lg bg-card border border-border/50 hover:border-brand/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-brand" />
                            <p className="font-medium text-sm">{upload.no_surat_jalan}</p>
                            <Badge variant={upload.tipe === 'Pengiriman' ? 'default' : 'secondary'} className="text-xs">
                              {upload.tipe}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(upload.created_at), 'HH:mm')}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{upload.supir}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{upload.file_count || 0} photos</span>
                          </div>
                        </div>

                        {upload.description && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">
                            {upload.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {timelineGroups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No timeline data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}
