import { FileWithProgress } from '@/lib/uploadSchema';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadProgressProps {
  files: FileWithProgress[];
}

export function UploadProgress({ files }: UploadProgressProps) {
  const totalFiles = files.length;
  const completedFiles = files.filter((f) => f.status === 'success').length;
  const failedFiles = files.filter((f) => f.status === 'error').length;
  const overallProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  if (totalFiles === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-card-foreground">Upload Progress</h3>
          <span className="text-sm text-muted-foreground">
            {completedFiles} / {totalFiles} completed
          </span>
        </div>
        <Progress value={overallProgress} className="h-2 mb-4" />
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 text-sm">
              {file.status === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              )}
              {file.status === 'error' && (
                <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              )}
              {(file.status === 'uploading' || file.status === 'compressing') && (
                <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
              )}
              {file.status === 'pending' && (
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
              )}
              <span className="flex-1 truncate text-foreground">{file.file.name}</span>
              {file.status === 'uploading' && (
                <span className="text-xs text-muted-foreground">{file.progress}%</span>
              )}
              {file.status === 'error' && file.error && (
                <span className="text-xs text-destructive">{file.error}</span>
              )}
            </div>
          ))}
        </div>

        {failedFiles > 0 && (
          <div className="mt-3 p-2 bg-destructive/10 rounded text-sm text-destructive">
            {failedFiles} file{failedFiles !== 1 ? 's' : ''} failed to upload
          </div>
        )}
      </div>
    </motion.div>
  );
}
