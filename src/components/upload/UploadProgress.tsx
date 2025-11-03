import { FileWithProgress } from '@/lib/uploadSchema';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadProgressProps {
  files: FileWithProgress[];
}

export function UploadProgress({ files }: UploadProgressProps) {
  const totalFiles = files.length;
  const completedFiles = files.filter((f) => f.status === 'success').length;
  const failedFiles = files.filter((f) => f.status === 'error').length;
  const uploadingFiles = files.filter((f) => f.status === 'uploading').length;
  const overallProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  if (totalFiles === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="glass-card p-6 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Upload Progress</h3>
        <div className="flex items-center gap-2 text-sm">
          {uploadingFiles > 0 && (
            <span className="flex items-center gap-1 text-brand">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </span>
          )}
          <span className="text-muted-foreground">
            {completedFiles} / {totalFiles}
          </span>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <Progress value={overallProgress} className="h-3" />
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{Math.round(overallProgress)}% complete</span>
          {failedFiles > 0 && (
            <span className="text-accent">{failedFiles} failed</span>
          )}
        </div>
      </div>
      
      {/* File List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {files.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {file.status === 'success' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
              )}
              {file.status === 'error' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <XCircle className="w-4 h-4 text-accent" />
                </div>
              )}
              {file.status === 'uploading' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                  <Loader2 className="w-4 h-4 text-brand animate-spin" />
                </div>
              )}
              {file.status === 'pending' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  {(file.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {file.status === 'uploading' && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <p className="text-xs text-brand">{file.progress}%</p>
                  </>
                )}
                {file.status === 'error' && file.error && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <p className="text-xs text-accent truncate">{file.error}</p>
                  </>
                )}
              </div>
            </div>

            {/* Status Badge */}
            {file.status === 'success' && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-xs font-medium text-success">
                Done
              </span>
            )}
            {file.status === 'error' && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-xs font-medium text-accent">
                Failed
              </span>
            )}
            {file.status === 'uploading' && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand/10 text-xs font-medium text-brand">
                {file.progress}%
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      {(completedFiles > 0 || failedFiles > 0) && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {completedFiles > 0 && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-4 w-4" />
                {completedFiles} succeeded
              </span>
            )}
            {failedFiles > 0 && (
              <span className="flex items-center gap-1 text-accent">
                <XCircle className="h-4 w-4" />
                {failedFiles} failed
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
