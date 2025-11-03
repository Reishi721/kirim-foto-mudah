import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import { FolderNode } from '@/lib/browseTypes';
import { sortFolderNodes } from '@/lib/folderHierarchy';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
  nodes: FolderNode[];
  onNodeClick?: (node: FolderNode) => void;
  selectedPath?: string;
}

interface TreeNodeProps {
  node: FolderNode;
  level: number;
  onNodeClick?: (node: FolderNode) => void;
  selectedPath?: string;
}

function TreeNode({ node, level, onNodeClick, selectedPath }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedPath === node.path;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    onNodeClick?.(node);
  };

  const getIcon = () => {
    if (node.type === 'nosj') return <File className="w-4 h-4 text-primary" />;
    return <Folder className="w-4 h-4 text-accent" />;
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors hover:bg-muted',
          isSelected && 'bg-primary/10 text-primary font-medium'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren && (
          <button onClick={handleToggle} className="p-0.5 hover:bg-muted-foreground/10 rounded">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        {getIcon()}
        <span className="text-sm flex-1 truncate">{node.name}</span>
        {node.recordCount !== undefined && (
          <span className="text-xs text-muted-foreground">({node.recordCount})</span>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {sortFolderNodes(node.children!).map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                level={level + 1}
                onNodeClick={onNodeClick}
                selectedPath={selectedPath}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FolderTree({ nodes, onNodeClick, selectedPath }: FolderTreeProps) {
  const sortedNodes = sortFolderNodes(nodes);

  if (sortedNodes.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No folders found
      </div>
    );
  }

  return (
    <div className="py-2">
      {sortedNodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          level={0}
          onNodeClick={onNodeClick}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}
