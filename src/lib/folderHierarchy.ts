import { FolderNode, UploadRecord } from './browseTypes';

const ID_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function buildFolderTree(records: UploadRecord[]): FolderNode[] {
  const tree: Map<string, FolderNode> = new Map();

  records.forEach((record) => {
    const [year, month, day, type, nosj] = record.folder_path.split('/').filter(Boolean);

    // Year node
    const yearPath = year;
    if (!tree.has(yearPath)) {
      tree.set(yearPath, {
        name: year,
        type: 'year',
        path: yearPath,
        children: [],
        recordCount: 0,
      });
    }
    const yearNode = tree.get(yearPath)!;
    yearNode.recordCount = (yearNode.recordCount || 0) + 1;

    // Month node
    const monthPath = `${year}/${month}`;
    let monthNode = yearNode.children?.find((c) => c.path === monthPath);
    if (!monthNode) {
      monthNode = {
        name: month,
        type: 'month',
        path: monthPath,
        children: [],
        recordCount: 0,
      };
      yearNode.children?.push(monthNode);
    }
    monthNode.recordCount = (monthNode.recordCount || 0) + 1;

    // Day node
    const dayPath = `${year}/${month}/${day}`;
    let dayNode = monthNode.children?.find((c) => c.path === dayPath);
    if (!dayNode) {
      dayNode = {
        name: day,
        type: 'day',
        path: dayPath,
        children: [],
        recordCount: 0,
      };
      monthNode.children?.push(dayNode);
    }
    dayNode.recordCount = (dayNode.recordCount || 0) + 1;

    // Type node (pengiriman/pengembalian)
    const typePath = `${year}/${month}/${day}/${type}`;
    let typeNode = dayNode.children?.find((c) => c.path === typePath);
    if (!typeNode) {
      typeNode = {
        name: type,
        type: 'type',
        path: typePath,
        children: [],
        recordCount: 0,
      };
      dayNode.children?.push(typeNode);
    }
    typeNode.recordCount = (typeNode.recordCount || 0) + 1;

    // NoSJ node
    const nosjPath = `${year}/${month}/${day}/${type}/${nosj}`;
    const nosjNode: FolderNode = {
      name: nosj,
      type: 'nosj',
      path: nosjPath,
      recordCount: record.file_count,
    };
    typeNode.children?.push(nosjNode);
  });

  // Convert map to sorted array
  return Array.from(tree.values()).sort((a, b) => b.name.localeCompare(a.name));
}

export function getMonthIndex(monthName: string): number {
  return ID_MONTHS.indexOf(monthName);
}

export function sortFolderNodes(nodes: FolderNode[]): FolderNode[] {
  return nodes.sort((a, b) => {
    if (a.type === 'year') {
      return parseInt(b.name) - parseInt(a.name);
    }
    if (a.type === 'month') {
      return getMonthIndex(b.name) - getMonthIndex(a.name);
    }
    if (a.type === 'day') {
      return parseInt(b.name) - parseInt(a.name);
    }
    return a.name.localeCompare(b.name);
  });
}
