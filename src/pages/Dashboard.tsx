import { DashboardHeader } from '@/components/dashboard/Header';
import { KPICard } from '@/components/dashboard/KPICard';
import { UploadsChart } from '@/components/dashboard/UploadsChart';
import { TypeChart } from '@/components/dashboard/TypeChart';
import { RecentUploadsTable } from '@/components/dashboard/RecentUploadsTable';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Camera, FolderOpen, HardDrive, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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

        {/* Tables & Actions */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentUploadsTable uploads={recentUploads} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
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
