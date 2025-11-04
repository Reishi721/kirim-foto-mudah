import { AlertTriangle, X, FileCheck, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-6"
      >
        <Alert variant="destructive" className="border-2 border-amber-500 bg-amber-500/10 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-full bg-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <AlertTitle className="text-lg font-bold flex items-center gap-2">
                  Duplicate File Detected
                  <Badge variant="outline" className="text-xs font-normal">
                    {duplicateInfo.existingFiles?.length} {duplicateInfo.existingFiles?.length === 1 ? 'match' : 'matches'}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="text-sm mt-2">
                  <span className="font-semibold">{fileName}</span> appears identical to existing files in your system.
                  Review the matches below before deciding to proceed.
                </AlertDescription>
              </div>

              {duplicateInfo.existingFiles && duplicateInfo.existingFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>Existing Files:</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {duplicateInfo.existingFiles.map((file, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-amber-500/50 transition-colors"
                      >
                        <FileCheck className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {file.noSuratJalan}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(file.uploadDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {duplicateInfo.existingFiles.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-7">
                      +{duplicateInfo.existingFiles.length - 3} more files found
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  size="default"
                  onClick={onProceed}
                  variant="outline"
                  className="border-amber-600 hover:bg-amber-600 hover:text-white"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Upload Anyway
                </Button>
                <Button
                  size="default"
                  variant="ghost"
                  onClick={onDismiss}
                  className="hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove File
                </Button>
              </div>
            </div>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}
