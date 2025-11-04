import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DriverStats {
  name: string;
  deliveries: number;
  photos: number;
  avgPhotosPerDelivery: number;
  trend: number;
}

interface DriverLeaderboardProps {
  uploads: any[];
}

export function DriverLeaderboard({ uploads }: DriverLeaderboardProps) {
  const calculateDriverStats = (): DriverStats[] => {
    const driverMap = new Map<string, { deliveries: number; photos: number }>();
    
    uploads.forEach(upload => {
      const existing = driverMap.get(upload.supir) || { deliveries: 0, photos: 0 };
      driverMap.set(upload.supir, {
        deliveries: existing.deliveries + 1,
        photos: existing.photos + (upload.file_count || 0)
      });
    });

    const stats: DriverStats[] = Array.from(driverMap.entries()).map(([name, data]) => ({
      name,
      deliveries: data.deliveries,
      photos: data.photos,
      avgPhotosPerDelivery: data.deliveries > 0 ? data.photos / data.deliveries : 0,
      trend: Math.random() * 20 - 5 // Simulated trend
    }));

    return stats.sort((a, b) => b.deliveries - a.deliveries).slice(0, 5);
  };

  const driverStats = calculateDriverStats();
  
  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-muted-foreground font-semibold">#{index + 1}</span>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="relative overflow-hidden p-4 md:p-6">
      <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-yellow-500 to-amber-600" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">Driver Leaderboard</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Top performers this period</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Trophy className="h-3 w-3" />
          Top 5
        </Badge>
      </div>

      <div className="space-y-3 md:space-y-4">
        {driverStats.map((driver, index) => (
          <motion.div
            key={driver.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-xl transition-colors ${
              index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-muted/30'
            }`}
          >
            <div className="flex-shrink-0 w-6 md:w-8 flex items-center justify-center">
              {getRankIcon(index)}
            </div>

            <Avatar className="h-8 w-8 md:h-10 md:w-10">
              <AvatarFallback className="bg-brand/20 text-brand font-semibold text-xs md:text-sm">
                {getInitials(driver.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold truncate text-sm md:text-base">{driver.name}</p>
                {driver.trend > 0 && (
                  <Badge variant="secondary" className="text-[10px] md:text-xs flex items-center gap-0.5 md:gap-1 px-1 md:px-2">
                    <TrendingUp className="h-2 w-2 md:h-3 md:w-3" />
                    <span className="hidden sm:inline">+{driver.trend.toFixed(0)}%</span>
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1 md:gap-3 text-[10px] md:text-xs text-muted-foreground">
                <span>{driver.deliveries} deliveries</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{driver.photos} photos</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden md:inline">{driver.avgPhotosPerDelivery.toFixed(1)} avg</span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="text-right">
                <p className="text-lg md:text-2xl font-bold text-brand">{driver.deliveries}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">total</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {driverStats.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No driver data yet</p>
        </div>
      )}
    </Card>
  );
}
