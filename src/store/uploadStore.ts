import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FileWithProgress, UploadFormData } from '@/lib/uploadSchema';

interface UploadJob {
  id: string;
  formData: UploadFormData;
  files: FileWithProgress[];
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  createdAt: number;
}

interface UploadStore {
  jobs: UploadJob[];
  currentJob: UploadJob | null;
  addJob: (formData: UploadFormData, files: FileWithProgress[]) => string;
  updateJob: (jobId: string, updates: Partial<UploadJob>) => void;
  updateFileProgress: (jobId: string, fileId: string, progress: number, status: FileWithProgress['status']) => void;
  removeJob: (jobId: string) => void;
  setCurrentJob: (jobId: string | null) => void;
  getPendingJobs: () => UploadJob[];
}

export const useUploadStore = create<UploadStore>()(
  persist(
    (set, get) => ({
      jobs: [],
      currentJob: null,

      addJob: (formData, files) => {
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newJob: UploadJob = {
          id: jobId,
          formData,
          files,
          status: 'pending',
          createdAt: Date.now(),
        };
        set((state) => ({ jobs: [...state.jobs, newJob] }));
        return jobId;
      },

      updateJob: (jobId, updates) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === jobId ? { ...job, ...updates } : job
          ),
        }));
      },

      updateFileProgress: (jobId, fileId, progress, status) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  files: job.files.map((file) =>
                    file.id === fileId ? { ...file, progress, status } : file
                  ),
                }
              : job
          ),
        }));
      },

      removeJob: (jobId) => {
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== jobId),
          currentJob: state.currentJob?.id === jobId ? null : state.currentJob,
        }));
      },

      setCurrentJob: (jobId) => {
        const job = jobId ? get().jobs.find((j) => j.id === jobId) || null : null;
        set({ currentJob: job });
      },

      getPendingJobs: () => {
        return get().jobs.filter((job) => job.status === 'pending');
      },
    }),
    {
      name: 'upload-storage',
      partialize: (state) => ({ jobs: state.jobs }),
    }
  )
);
