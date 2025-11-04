import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, File, Search, X } from 'lucide-react';
import { FolderNode } from '@/lib/browseTypes';
import { sortFolderNodes } from '@/lib/folderHierarchy';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    // Auto-expand when clicked if it has children
    if (hasChildren && !isExpanded) {
      setIsExpanded(true);
    }
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
  const [searchQuery, setSearchQuery] = useState('');

  const filterNodes = (nodes: FolderNode[], query: string): FolderNode[] => {
    if (!query) return nodes;
    
    return nodes.reduce<FolderNode[]>((acc, node) => {
      const matchesQuery = node.name.toLowerCase().includes(query.toLowerCase()) ||
                          node.path.toLowerCase().includes(query.toLowerCase());
      
      const filteredChildren = node.children ? filterNodes(node.children, query) : [];
      
      if (matchesQuery || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        });
      }
      
      return acc;
    }, []);
  };

  const filteredNodes = useMemo(
    () => filterNodes(sortFolderNodes(nodes), searchQuery),
    [nodes, searchQuery]
  );

  if (nodes.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No folders found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredNodes.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No matching folders found
          </div>
        ) : (
          filteredNodes.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              level={0}
              onNodeClick={onNodeClick}
              selectedPath={selectedPath}
            />
          ))
        )}
      </div>
    </div>
  );
}
