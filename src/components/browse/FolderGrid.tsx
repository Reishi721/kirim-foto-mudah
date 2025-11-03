import { Folder } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { FolderNode } from '@/lib/browseTypes';
import { sortFolderNodes } from '@/lib/folderHierarchy';
import { motion } from 'framer-motion';

interface FolderGridProps {
  folders: FolderNode[];
  onFolderClick: (folder: FolderNode) => void;
}

export function FolderGrid({ folders, onFolderClick }: FolderGridProps) {
  const sortedFolders = sortFolderNodes(folders);

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedFolders.map((folder, index) => (
          <motion.div
            key={folder.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card
              className="p-4 cursor-pointer hover:bg-accent transition-colors group"
              onClick={() => onFolderClick(folder)}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Folder className="w-8 h-8 text-primary" />
                </div>
                <div className="w-full">
                  <p className="font-medium text-sm truncate" title={folder.name}>
                    {folder.name}
                  </p>
                  {folder.recordCount !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {folder.recordCount} {folder.type === 'nosj' ? 'files' : 'items'}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
