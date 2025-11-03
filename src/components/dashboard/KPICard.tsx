import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  index: number;
}

export function KPICard({ title, value, icon: Icon, delta, deltaLabel, index }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/[^0-9]/g, '')) || 0;

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000;
      const steps = 30;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.22 }}
      className="slide-fade-in"
    >
      <Card className="relative overflow-hidden p-6 hover-lift">
        <div className="absolute top-0 left-0 w-12 h-1 bg-gradient-primary" />
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-4xl font-bold tracking-tight">
              {typeof value === 'number' ? displayValue.toLocaleString() : value}
            </p>
            {delta !== undefined && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand/10 text-xs font-medium">
                {delta > 0 ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-accent" />
                )}
                <span className={delta > 0 ? 'text-success' : 'text-accent'}>
                  {Math.abs(delta)}%
                </span>
                <span className="text-muted-foreground">{deltaLabel}</span>
              </div>
            )}
          </div>
          <div className="rounded-xl bg-brand/10 p-3">
            <Icon className="h-6 w-6 text-brand" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
