import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Upload {
  id: string;
  no_surat_jalan: string;
  tanggal: string;
  tipe: string;
  supir: string;
  file_count: number;
  folder_path: string;
}

interface RecentUploadsTableProps {
  uploads: Upload[];
}

export function RecentUploadsTable({ uploads }: RecentUploadsTableProps) {
  const navigate = useNavigate();

  const handleOpenFolder = (folderPath: string) => {
    navigate(`/browse?folder=${encodeURIComponent(folderPath)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Uploads</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. SJ</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Files</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No uploads yet
                    </TableCell>
                  </TableRow>
                ) : (
                  uploads.map((upload) => (
                    <TableRow key={upload.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{upload.no_surat_jalan}</TableCell>
                      <TableCell>{new Date(upload.tanggal).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          upload.tipe === 'Pengiriman' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {upload.tipe}
                        </span>
                      </TableCell>
                      <TableCell>{upload.supir}</TableCell>
                      <TableCell className="text-right">{upload.file_count}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenFolder(upload.folder_path)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
