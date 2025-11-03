import { DashboardHeader } from '@/components/dashboard/Header';
import { KPICard } from '@/components/dashboard/KPICard';
import { UploadsChart } from '@/components/dashboard/UploadsChart';
import { TypeChart } from '@/components/dashboard/TypeChart';
import { RecentUploadsTable } from '@/components/dashboard/RecentUploadsTable';
import { Camera, FolderOpen, HardDrive, TrendingUp, Loader2, Upload, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalRecords: number;
  totalPhotos: number;
  driversCount: number;
  thisMonthRecords: number;
}

interface ChartData {
  date: string;
  uploads: number;
}

interface TypeData {
  name: string;
  value: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    totalPhotos: 0,
    driversCount: 0,
    thisMonthRecords: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [typeData, setTypeData] = useState<TypeData[]>([]);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('upload_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const records = data || [];
      
      // Calculate stats
      const totalFiles = records.reduce((sum, r) => sum + (r.file_count || 0), 0);
      const uniqueDrivers = new Set(records.map(r => r.supir)).size;
      
      const now = new Date();
      const thisMonth = records.filter(r => {
        const recordDate = new Date(r.created_at);
        return recordDate.getMonth() === now.getMonth() && 
               recordDate.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        totalRecords: records.length,
        totalPhotos: totalFiles,
        driversCount: uniqueDrivers,
        thisMonthRecords: thisMonth,
      });

      // Prepare chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const uploadsPerDay = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        uploads: records.filter(r => r.created_at.startsWith(date)).length,
      }));

      setChartData(uploadsPerDay);

      // Type distribution
      const pengiriman = records.filter(r => r.tipe === 'Pengiriman').length;
      const pengembalian = records.filter(r => r.tipe === 'Pengembalian').length;

      setTypeData([
        { name: 'Pengiriman', value: pengiriman },
        { name: 'Pengembalian', value: pengembalian },
      ]);

      // Recent uploads
      setRecentUploads(records.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your deliveries.
          </p>
        </motion.div>

        {/* Quick Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-primary group"
            onClick={() => navigate('/upload')}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Upload Photos</h3>
                <p className="text-sm text-muted-foreground">Add new delivery photos</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-accent group"
            onClick={() => navigate('/browse')}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-accent/10 p-3 group-hover:bg-accent/20 transition-colors">
                <FolderOpen className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Browse Photos</h3>
                <p className="text-sm text-muted-foreground">View all deliveries</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-muted-foreground/20 group"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-muted p-3 group-hover:bg-muted/80 transition-colors">
                <Download className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Export CSV</h3>
                <p className="text-sm text-muted-foreground">Download reports</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Photos"
            value={stats.totalPhotos}
            icon={Camera}
            delta={12}
            deltaLabel="vs last month"
            index={0}
          />
          <KPICard
            title="Total Deliveries"
            value={stats.totalRecords}
            icon={FolderOpen}
            delta={8}
            deltaLabel="vs last month"
            index={1}
          />
          <KPICard
            title="Active Drivers"
            value={stats.driversCount}
            icon={TrendingUp}
            delta={5}
            deltaLabel="vs last month"
            index={2}
          />
          <KPICard
            title="This Month"
            value={stats.thisMonthRecords}
            icon={HardDrive}
            delta={-3}
            deltaLabel="vs last month"
            index={3}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <UploadsChart data={chartData} />
          <TypeChart data={typeData} />
        </div>

        {/* Recent Uploads Table */}
        <RecentUploadsTable uploads={recentUploads} />
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Surat Jalan System © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
