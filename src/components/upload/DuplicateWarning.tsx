import { AlertTriangle, X, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import type { DuplicateInfo } from '@/lib/fileQuality';

interface DuplicateWarningProps {
  fileName: string;
  duplicateInfo: DuplicateInfo;
  onDismiss: () => void;
  onProceed: () => void;
}

export function DuplicateWarning({ fileName, duplicateInfo, onDismiss, onProceed }: DuplicateWarningProps) {
  if (!duplicateInfo.isDuplicate) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4 p-4 rounded-lg border-2 border-amber-500/50 bg-amber-500/10"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold text-sm">Possible Duplicate Detected</p>
              <Badge variant="outline" className="text-xs">
                {duplicateInfo.existingFiles?.length} match{duplicateInfo.existingFiles?.length !== 1 ? 'es' : ''}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              <span className="font-medium">{fileName}</span> appears to be a duplicate of existing files
            </p>

            {duplicateInfo.existingFiles && duplicateInfo.existingFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                <p className="text-xs font-medium text-muted-foreground">Existing files:</p>
                {duplicateInfo.existingFiles.slice(0, 3).map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs p-2 rounded bg-card/50">
                    <FileCheck className="h-3 w-3 text-brand" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {file.noSuratJalan}
                    </Badge>
                    <span className="text-muted-foreground">
                      {format(new Date(file.uploadDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                ))}
                {duplicateInfo.existingFiles.length > 3 && (
                  <p className="text-xs text-muted-foreground ml-5">
                    +{duplicateInfo.existingFiles.length - 3} more
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onProceed}
                className="text-xs"
              >
                Upload Anyway
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Remove File
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
