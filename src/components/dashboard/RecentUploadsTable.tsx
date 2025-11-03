import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
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
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-1 bg-gradient-brand opacity-60" />
      <div className="p-6">
        <h2 className="font-semibold mb-6">Recent Uploads</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-medium">No. SJ</TableHead>
                <TableHead className="font-medium">Date</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Driver</TableHead>
                <TableHead className="text-right font-medium">Files</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No uploads yet
                  </TableCell>
                </TableRow>
              ) : (
                uploads.map((upload, index) => (
                  <TableRow 
                    key={upload.id} 
                    className="hover:bg-muted/30 transition-colors border-border/30"
                    style={{ 
                      animation: `slide-fade-in 220ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 60}ms backwards` 
                    }}
                  >
                    <TableCell className="font-medium">{upload.no_surat_jalan}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(upload.tanggal).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${
                        upload.tipe === 'Pengiriman' 
                          ? 'bg-success/10 text-success border border-success/20' 
                          : 'bg-brand/10 text-brand border border-brand/20'
                      }`}>
                        {upload.tipe}
                      </span>
                    </TableCell>
                    <TableCell>{upload.supir}</TableCell>
                    <TableCell className="text-right font-medium">{upload.file_count}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenFolder(upload.folder_path)}
                        className="hover:bg-brand/10 hover:text-brand"
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
  );
}
