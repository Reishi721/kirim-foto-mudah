import { DashboardHeader } from '@/components/dashboard/Header';
import { KPICard } from '@/components/dashboard/KPICard';
import { UploadsChart } from '@/components/dashboard/UploadsChart';
import { TypeChart } from '@/components/dashboard/TypeChart';
import { RecentUploadsTable } from '@/components/dashboard/RecentUploadsTable';
import { PredictiveForecast } from '@/components/dashboard/PredictiveForecast';
import { DriverLeaderboard } from '@/components/dashboard/DriverLeaderboard';
import { AnomalyDetector } from '@/components/dashboard/AnomalyDetector';
import { TimelineDrilldown } from '@/components/dashboard/TimelineDrilldown';
import { Camera, FolderOpen, HardDrive, TrendingUp, Loader2, Upload, Download, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUploadRecords } from '@/hooks/useUploadRecords';
import { DashboardSkeleton } from '@/components/ui/skeleton-loader';

interface Stats {
  totalRecords: number;
  totalPhotos: number;
  driversCount: number;
  thisMonthRecords: number;
  photosChange: number;
  deliveriesChange: number;
  driversChange: number;
  monthRecordsChange: number;
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
  const { data: records = [], isLoading } = useUploadRecords();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  // Calculate stats from records using useMemo for performance
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const thisMonthRecords = records.filter(r => {
      const recordDate = new Date(r.created_at);
      return recordDate.getMonth() === currentMonth && 
             recordDate.getFullYear() === currentYear;
    });
    
    const lastMonthRecords = records.filter(r => {
      const recordDate = new Date(r.created_at);
      return recordDate.getMonth() === lastMonth && 
             recordDate.getFullYear() === lastMonthYear;
    });
    
    const totalPhotos = records.reduce((sum, r) => sum + (r.file_count || 0), 0);
    const lastMonthPhotos = lastMonthRecords.reduce((sum, r) => sum + (r.file_count || 0), 0);
    const thisMonthPhotos = thisMonthRecords.reduce((sum, r) => sum + (r.file_count || 0), 0);
    
    const driversSet = new Set(records.map(r => r.supir));
    const lastMonthDrivers = new Set(lastMonthRecords.map(r => r.supir));
    
    const photosChange = lastMonthPhotos > 0 
      ? Math.round(((thisMonthPhotos - lastMonthPhotos) / lastMonthPhotos) * 100) 
      : 0;
    
    const deliveriesChange = lastMonthRecords.length > 0
      ? Math.round(((thisMonthRecords.length - lastMonthRecords.length) / lastMonthRecords.length) * 100)
      : 0;
    
    const driversChange = lastMonthDrivers.size > 0
      ? Math.round(((driversSet.size - lastMonthDrivers.size) / lastMonthDrivers.size) * 100)
      : 0;

    return {
      totalRecords: records.length,
      totalPhotos,
      driversCount: driversSet.size,
      thisMonthRecords: thisMonthRecords.length,
      photosChange,
      deliveriesChange,
      driversChange,
      monthRecordsChange: deliveriesChange,
    };
  }, [records]);

  // Calculate chart data
  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => ({
      date,
      uploads: records.filter(r => r.created_at.split('T')[0] === date).length,
    }));
  }, [records]);

  // Calculate type data
  const typeData = useMemo(() => {
    const pengiriman = records.filter(r => r.tipe === 'Pengiriman').length;
    const pengembalian = records.filter(r => r.tipe === 'Pengembalian').length;
    
    return [
      { name: 'Pengiriman', value: pengiriman },
      { name: 'Pengembalian', value: pengembalian },
    ];
  }, [records]);

  // Recent uploads
  const recentUploads = useMemo(() => records.slice(0, 10), [records]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="relative overflow-hidden rounded-2xl p-6 sm:p-10 glass-card"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-1.5 bg-gradient-primary rounded-full" />
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pl-6">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Welcome back! Here's what's happening with your deliveries.
              </p>
              <span className="text-xs text-muted-foreground/60 sm:ml-auto">Updated 5m ago</span>
            </div>
          </div>
        </motion.div>

        {/* Hero Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.22 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
        >
          <Card 
            className="relative overflow-hidden p-4 sm:p-8 cursor-pointer hover-lift group"
            onClick={() => navigate('/upload')}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary" />
            <div className="flex items-start gap-3 sm:gap-6">
              <div className="rounded-lg sm:rounded-xl bg-brand/10 p-3 sm:p-4 group-hover:bg-brand/20 transition-colors duration-220">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-brand" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg sm:text-xl mb-1">Upload Photos</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Add new delivery photos with metadata</p>
              </div>
            </div>
          </Card>

          <Card 
            className="relative overflow-hidden p-4 sm:p-8 cursor-pointer hover-lift group"
            onClick={() => navigate('/browse')}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-success" />
            <div className="flex items-start gap-3 sm:gap-6">
              <div className="rounded-lg sm:rounded-xl bg-success/10 p-3 sm:p-4 group-hover:bg-success/20 transition-colors duration-220">
                <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg sm:text-xl mb-1">Browse Photos</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">View and manage all delivery records</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Admin Card (only for admins) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.22 }}
          >
            <Card 
              className="relative overflow-hidden p-4 sm:p-6 cursor-pointer hover-lift group border-accent/50"
              onClick={() => navigate('/admin')}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-from-l-accent to-accent-foreground" />
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="rounded-lg sm:rounded-xl bg-accent/10 p-2 sm:p-3 group-hover:bg-accent/20 transition-colors duration-220">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">Admin Dashboard</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Manage users and content</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.24 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          <KPICard
            title="Total Photos"
            value={stats.totalPhotos}
            icon={Camera}
            delta={stats.photosChange}
            deltaLabel="vs last month"
            index={0}
          />
          <KPICard
            title="Total Deliveries"
            value={stats.totalRecords}
            icon={FolderOpen}
            delta={stats.deliveriesChange}
            deltaLabel="vs last month"
            index={1}
          />
          <KPICard
            title="Active Drivers"
            value={stats.driversCount}
            icon={TrendingUp}
            delta={stats.driversChange}
            deltaLabel="vs last month"
            index={2}
          />
          <KPICard
            title="This Month"
            value={stats.thisMonthRecords}
            icon={HardDrive}
            delta={stats.monthRecordsChange}
            deltaLabel="vs last month"
            index={3}
          />
        </motion.div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.22 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <UploadsChart data={chartData} />
          <TypeChart data={typeData} />
        </motion.div>

        {/* Enhanced Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.22 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <PredictiveForecast historicalData={chartData} />
          <AnomalyDetector uploads={recentUploads} chartData={chartData} />
        </motion.div>

        {/* Leaderboard and Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.22 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <DriverLeaderboard uploads={recentUploads} />
          <TimelineDrilldown uploads={recentUploads} />
        </motion.div>

        {/* Recent Uploads Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.54, duration: 0.22 }}
        >
          <RecentUploadsTable uploads={recentUploads} />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Documenting System © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
