import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { offlineStorage } from '@/lib/offlineStorage';
import { UploadRecord } from '@/lib/browseTypes';

export const useUploadRecords = () => {
  return useQuery<UploadRecord[]>({
    queryKey: ['upload-records'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('upload_records')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const records = (data || []) as UploadRecord[];
        
        // Cache in IndexedDB for offline access
        await offlineStorage.saveRecords(records);
        
        return records;
      } catch (error) {
        console.error('Error fetching records:', error);
        // Try to load from offline cache
        const cachedData = await offlineStorage.getRecords();
        if (cachedData.length > 0) {
          toast.info('Showing cached data - offline mode');
          return cachedData as UploadRecord[];
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCreateUploadRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (record: Omit<UploadRecord, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('upload_records')
        .insert([record])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upload-records'] });
      toast.success('Record created successfully');
    },
    onError: (error) => {
      console.error('Error creating record:', error);
      toast.error('Failed to create record');
    },
  });
};
