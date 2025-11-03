import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FolderOpen, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => navigate('/upload')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Photos
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => navigate('/browse')}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Browse Photos
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
