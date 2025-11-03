import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ForecastData {
  date: string;
  actual?: number;
  predicted: number;
  confidence: number;
}

interface PredictiveForecastProps {
  historicalData: Array<{ date: string; uploads: number }>;
}

export function PredictiveForecast({ historicalData }: PredictiveForecastProps) {
  // Simple linear regression for prediction
  const calculateForecast = (): ForecastData[] => {
    if (historicalData.length < 2) return [];
    
    const n = historicalData.length;
    const values = historicalData.map(d => d.uploads);
    
    // Calculate trend
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Combine historical with predictions
    const forecast: ForecastData[] = historicalData.map((d, idx) => ({
      date: d.date,
      actual: d.uploads,
      predicted: Math.max(0, Math.round(slope * idx + intercept)),
      confidence: 95
    }));
    
    // Add 3 days of predictions
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      forecast.push({
        date: futureDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        predicted: Math.max(0, Math.round(slope * (n + i - 1) + intercept)),
        confidence: Math.max(70, 95 - i * 10)
      });
    }
    
    return forecast;
  };

  const forecastData = calculateForecast();
  const trend = forecastData.length > 1 
    ? forecastData[forecastData.length - 1].predicted > forecastData[0].predicted 
    : true;

  return (
    <Card className="relative overflow-hidden p-6">
      <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-from-l-brand to-accent" />
      
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-semibold mb-2">Predictive Forecast</h2>
          <p className="text-sm text-muted-foreground">ML-based upload predictions</p>
        </div>
        <Badge variant={trend ? "default" : "secondary"} className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {trend ? 'Upward' : 'Stable'}
        </Badge>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={forecastData}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              backdropFilter: 'blur(12px)',
            }}
          />
          <ReferenceLine 
            x={historicalData[historicalData.length - 1]?.date} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="3 3" 
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="hsl(var(--brand))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--brand))', r: 4 }}
            name="Actual"
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: 'hsl(var(--accent))', r: 4 }}
            name="Predicted"
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        <span>Confidence decreases for future predictions</span>
      </div>
    </Card>
  );
}
