import { Card } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UploadsChartProps {
  data: Array<{ date: string; uploads: number }>;
}

export function UploadsChart({ data }: UploadsChartProps) {
  return (
    <Card className="relative overflow-hidden p-6">
      <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-primary" />
      <h2 className="font-semibold mb-6">Uploads Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              backdropFilter: 'blur(12px)',
            }}
          />
          <Area
            type="monotone"
            dataKey="uploads"
            stroke="hsl(var(--brand))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUploads)"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
