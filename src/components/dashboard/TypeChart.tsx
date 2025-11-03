import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TypeChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS = ['hsl(var(--brand))', 'hsl(var(--accent))'];

export function TypeChart({ data }: TypeChartProps) {
  return (
    <Card className="relative overflow-hidden p-6">
      <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-success" />
      <h2 className="font-semibold mb-6">By Type</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={90}
            fill="#8884d8"
            dataKey="value"
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              backdropFilter: 'blur(12px)',
            }}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: '14px',
              paddingTop: '20px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
