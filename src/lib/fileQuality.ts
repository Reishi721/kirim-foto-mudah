import heic2any from 'heic2any';

// Generate file hash for duplicate detection
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Convert HEIC to JPEG
export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    console.log('Converting HEIC file:', file.name);
    
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    }) as Blob;

    // Create new file with converted blob
    const newFileName = file.name.replace(/\.heic$/i, '.jpg');
    const convertedFile = new File([convertedBlob], newFileName, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    console.log('HEIC conversion successful:', newFileName);
    return convertedFile;
  } catch (error) {
    console.error('Failed to convert HEIC:', error);
    throw new Error('Failed to convert HEIC file. Please try converting it manually to JPG.');
  }
}

// Check if file is HEIC
export function isHeicFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic';
}

// Detect duplicate files based on hash
export interface DuplicateInfo {
  isDuplicate: boolean;
  existingFiles?: Array<{
    name: string;
    uploadDate: string;
    noSuratJalan: string;
  }>;
}

export async function checkForDuplicates(
  fileHash: string,
  fileName: string,
  supabase: any
): Promise<DuplicateInfo> {
  try {
    // Check if this hash already exists in photo_metadata
    const { data: existingFiles, error } = await supabase
      .from('photo_metadata')
      .select(`
        file_name,
        created_at,
        upload_record_id,
        upload_records!inner(no_surat_jalan)
      `)
      .eq('file_hash', fileHash);

    if (error) {
      console.error('Error checking for duplicates:', error);
      return { isDuplicate: false };
    }

    if (existingFiles && existingFiles.length > 0) {
      return {
        isDuplicate: true,
        existingFiles: existingFiles.map((file: any) => ({
          name: file.file_name,
          uploadDate: file.created_at,
          noSuratJalan: file.upload_records.no_surat_jalan
        }))
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Error in duplicate detection:', error);
    return { isDuplicate: false };
  }
}

// Calculate file similarity score (for near-duplicate detection)
export function calculateSimilarity(file1Name: string, file2Name: string): number {
  // Simple name-based similarity using Levenshtein distance
  const longer = file1Name.length > file2Name.length ? file1Name : file2Name;
  const shorter = file1Name.length > file2Name.length ? file2Name : file1Name;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Retention policy types
export type RetentionPeriod = '30days' | '90days' | '1year' | '2years' | 'forever';

export interface RetentionPolicy {
  period: RetentionPeriod;
  action: 'archive' | 'delete' | 'warn';
  enabled: boolean;
}

export const RETENTION_PERIODS: Record<RetentionPeriod, number> = {
  '30days': 30,
  '90days': 90,
  '1year': 365,
  '2years': 730,
  'forever': Infinity
};

export function checkRetentionStatus(
  uploadDate: string,
  policy: RetentionPolicy
): { shouldAction: boolean; daysOld: number; daysUntilAction: number } {
  const uploadDateTime = new Date(uploadDate).getTime();
  const now = Date.now();
  const daysOld = Math.floor((now - uploadDateTime) / (1000 * 60 * 60 * 24));
  const retentionDays = RETENTION_PERIODS[policy.period];
  const daysUntilAction = retentionDays - daysOld;

  return {
    shouldAction: policy.enabled && daysOld >= retentionDays && retentionDays !== Infinity,
    daysOld,
    daysUntilAction: Math.max(0, daysUntilAction)
  };
}
