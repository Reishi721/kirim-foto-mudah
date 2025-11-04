import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Clock, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface Anomaly {
  type: 'low_activity' | 'high_activity' | 'unusual_time' | 'photo_count';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: string;
  timestamp: string;
}

interface AnomalyDetectorProps {
  uploads: any[];
  chartData: Array<{ date: string; uploads: number }>;
}

export function AnomalyDetector({ uploads, chartData }: AnomalyDetectorProps) {
  const detectAnomalies = (): Anomaly[] => {
    const anomalies: Anomaly[] = [];
    
    // Detect unusual activity patterns
    const avgUploads = chartData.reduce((sum, d) => sum + d.uploads, 0) / chartData.length;
    const todayUploads = chartData[chartData.length - 1]?.uploads || 0;
    
    if (todayUploads < avgUploads * 0.5) {
      anomalies.push({
        type: 'low_activity',
        severity: 'medium',
        message: 'Unusually low activity detected',
        details: `Today's uploads (${todayUploads}) are ${((1 - todayUploads/avgUploads) * 100).toFixed(0)}% below average`,
        timestamp: new Date().toISOString()
      });
    } else if (todayUploads > avgUploads * 1.5) {
      anomalies.push({
        type: 'high_activity',
        severity: 'low',
        message: 'Higher than usual activity',
        details: `Today's uploads (${todayUploads}) are ${((todayUploads/avgUploads - 1) * 100).toFixed(0)}% above average`,
        timestamp: new Date().toISOString()
      });
    }

    // Detect unusual photo counts
    const photoCountsPerUpload = uploads.map(u => u.file_count || 0).filter(c => c > 0);
    if (photoCountsPerUpload.length > 0) {
      const avgPhotos = photoCountsPerUpload.reduce((a, b) => a + b, 0) / photoCountsPerUpload.length;
      const unusualUploads = uploads.filter(u => u.file_count > avgPhotos * 2);
      
      if (unusualUploads.length > 0) {
        anomalies.push({
          type: 'photo_count',
          severity: 'low',
          message: 'Unusual photo volume detected',
          details: `${unusualUploads.length} delivery(s) with significantly more photos than average`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Detect time-based anomalies
    const recentHours = uploads.slice(0, 5).map(u => new Date(u.created_at).getHours());
    const weekendUploads = uploads.filter(u => {
      const day = new Date(u.created_at).getDay();
      return day === 0 || day === 6;
    }).length;

    if (weekendUploads > uploads.length * 0.3) {
      anomalies.push({
        type: 'unusual_time',
        severity: 'medium',
        message: 'Weekend activity detected',
        details: `${((weekendUploads / uploads.length) * 100).toFixed(0)}% of uploads occur on weekends`,
        timestamp: new Date().toISOString()
      });
    }

    return anomalies.slice(0, 4); // Return top 4 anomalies
  };

  const anomalies = detectAnomalies();

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'unusual_time': return <Clock className="h-4 w-4" />;
      case 'photo_count': return <Camera className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="relative overflow-hidden p-4 md:p-6">
      <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-destructive to-amber-500" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">Anomaly Detection</h2>
          <p className="text-xs md:text-sm text-muted-foreground">AI-powered pattern analysis</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <AlertTriangle className="h-3 w-3" />
          {anomalies.length} detected
        </Badge>
      </div>

      <div className="space-y-2 md:space-y-3">
        {anomalies.map((anomaly, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 md:p-4 rounded-xl bg-muted/30 border border-border/50"
          >
            <div className="flex items-start gap-2 md:gap-3">
              <div className={`mt-0.5 p-1.5 md:p-2 rounded-lg ${
                anomaly.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                anomaly.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                'bg-muted text-muted-foreground'
              }`}>
                {getIcon(anomaly.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <p className="font-medium text-xs md:text-sm">{anomaly.message}</p>
                  <Badge variant={getSeverityColor(anomaly.severity) as any} className="text-[10px] md:text-xs self-start">
                    {anomaly.severity}
                  </Badge>
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">
                  {anomaly.details}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {anomalies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No anomalies detected</p>
            <p className="text-xs mt-1">All patterns appear normal</p>
          </div>
        )}
      </div>
    </Card>
  );
}
