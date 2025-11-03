export interface PhotoFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
  url?: string;
  metadata?: PhotoMetadata;
}

export interface PhotoMetadata {
  noSuratJalan: string;
  tanggal: string;
  tipe: 'Pengiriman' | 'Pengembalian';
  supir: string;
  helper1?: string;
  helper2?: string;
  description?: string;
  keterangan?: string;
  tags?: string[];
  geo?: {
    lat: number;
    lng: number;
    address?: string;
  };
  exif?: {
    camera?: string;
    timestamp?: string;
  };
}

export interface UploadRecord {
  id: string;
  no_surat_jalan: string;
  tanggal: string;
  tipe: string;
  supir: string;
  helper1?: string;
  helper2?: string;
  description?: string;
  folder_path: string;
  file_count: number;
  created_at: string;
  updated_at: string;
}

export interface FolderNode {
  name: string;
  type: 'year' | 'month' | 'day' | 'type' | 'nosj';
  path: string;
  children?: FolderNode[];
  recordCount?: number;
}

export type ViewMode = 'grid' | 'list';

export interface FilterState {
  search: string;
  type: 'all' | 'Pengiriman' | 'Pengembalian';
  dateFrom?: string;
  dateTo?: string;
  supir?: string;
  tags?: string[];
}
