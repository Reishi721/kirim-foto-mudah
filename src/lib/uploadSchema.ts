import { z } from "zod";

export const DRIVERS = ["Nainggolan", "Herman", "Esron", "Yusuf"] as const;

export const UploadFormSchema = z.object({
  noSuratJalan: z.string().min(1, "No Surat Jalan is required"),
  tanggal: z.date({ required_error: "Tanggal is required" }),
  tipe: z.literal("Pengiriman"),
  supir: z.enum(DRIVERS, { required_error: "Please select a driver" }),
  helper1: z.string().optional(),
  helper2: z.string().optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

export type UploadFormData = z.infer<typeof UploadFormSchema>;

export interface FileWithProgress {
  id: string;
  file: File;
  compressedFile?: File;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}
