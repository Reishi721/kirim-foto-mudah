import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FolderOpen, Truck, Package, Users, Calendar, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Stats {
  totalRecords: number;
  totalPhotos: number;
  driversCount: number;
  thisMonthRecords: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    totalPhotos: 0,
    driversCount: 0,
    thisMonthRecords: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: records, error } = await supabase
        .from('upload_records')
        .select('*');

      if (error) throw error;

      const totalPhotos = records?.reduce((sum, r) => sum + (r.file_count || 0), 0) || 0;
      const uniqueDrivers = new Set(records?.map((r) => r.supir) || []).size;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = records?.filter((r) => {
        const date = new Date(r.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length || 0;

      setStats({
        totalRecords: records?.length || 0,
        totalPhotos,
        driversCount: uniqueDrivers,
        thisMonthRecords: thisMonth,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const cardHoverVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.02,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                <Truck className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Surat Jalan</h1>
                <p className="text-sm text-muted-foreground">Delivery Documentation System</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Choose an action to get started
            </p>
          </motion.div>

          {/* Action Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {/* Upload Card */}
            <motion.div
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer group overflow-hidden border-2 hover:border-primary/50 transition-colors h-full"
                onClick={() => navigate('/upload')}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <motion.div
                      className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Upload className="w-10 h-10 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        Upload Photos
                      </h3>
                      <p className="text-muted-foreground">
                        Upload and organize delivery documentation with automatic folder structure
                      </p>
                    </div>
                    <div className="pt-4">
                      <div className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        Get Started
                        <motion.span
                          className="inline-block ml-1"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          →
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Browse Card */}
            <motion.div
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer group overflow-hidden border-2 hover:border-accent/50 transition-colors h-full"
                onClick={() => navigate('/browse')}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <motion.div
                      className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors"
                      whileHover={{ rotate: [0, 10, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <FolderOpen className="w-10 h-10 text-accent" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        Browse Photos
                      </h3>
                      <p className="text-muted-foreground">
                        Explore organized folders, filter by date, driver, and preview photos with metadata
                      </p>
                    </div>
                    <div className="pt-4">
                      <div className="inline-flex items-center text-sm font-medium text-accent group-hover:gap-2 transition-all">
                        Explore Now
                        <motion.span
                          className="inline-block ml-1"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          →
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {isLoading ? '...' : stats.totalRecords}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Deliveries
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {isLoading ? '...' : stats.totalPhotos}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Photos
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-success/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-success" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {isLoading ? '...' : stats.driversCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Drivers
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {isLoading ? '...' : stats.thisMonthRecords}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      This Month
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
