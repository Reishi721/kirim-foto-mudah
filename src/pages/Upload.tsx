import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { UploadFormSchema, UploadFormData, FileWithProgress, DRIVERS } from '@/lib/uploadSchema';
import { buildUploadPath, formatDateISO } from '@/lib/pathBuilder';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Upload() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<UploadFormData>({
    resolver: zodResolver(UploadFormSchema),
    defaultValues: {
      tipe: 'Pengiriman',
      noSuratJalan: '',
      helper1: '',
      helper2: '',
    },
  });

  const handleFilesAdded = (newFiles: FileWithProgress[]) => {
    setFiles((prev) => {
      const existingIds = new Set(prev.map((f) => f.id));
      const uniqueNewFiles = newFiles.filter((f) => !existingIds.has(f.id));
      
      // If file already exists, update it (for compression)
      const updated = prev.map((existing) => {
        const match = newFiles.find((n) => n.id === existing.id);
        return match || existing;
      });
      
      return [...updated, ...uniqueNewFiles];
    });
  };

  const handleFileRemoved = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const onSubmit = async (data: UploadFormData) => {
    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    const folderPath = buildUploadPath({
      noSuratJalan: data.noSuratJalan,
      tanggal: data.tanggal,
    });

    try {
      // Upload each file
      for (const fileItem of files) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'uploading' } : f))
        );

        const fileToUpload = fileItem.compressedFile || fileItem.file;
        const filePath = `${folderPath}/${fileItem.file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('surat-jalan-uploads')
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, status: 'error', error: uploadError.message }
                : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'success', progress: 100 } : f))
          );
        }
      }

      // Save metadata to database
      const { data: user } = await supabase.auth.getUser();
      
      const { error: dbError } = await supabase.from('upload_records').insert({
        no_surat_jalan: data.noSuratJalan,
        tanggal: formatDateISO(data.tanggal),
        tipe: data.tipe,
        supir: data.supir,
        helper1: data.helper1 || '—',
        helper2: data.helper2 || '—',
        folder_path: folderPath,
        file_count: files.length,
        user_id: user.user?.id,
      });

      if (dbError) {
        toast.error('Failed to save metadata: ' + dbError.message);
      } else {
        const successCount = files.filter((f) => f.status === 'success').length;
        toast.success(`Successfully uploaded ${successCount} of ${files.length} files!`);
        
        // Reset form
        form.reset();
        setFiles([]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const isFormValid = form.formState.isValid && files.length > 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Surat Jalan</h1>
          <p className="text-muted-foreground">Upload photos for delivery documentation</p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Information</CardTitle>
            <CardDescription>Fill in the delivery details and upload photos</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="noSuratJalan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No Surat Jalan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter delivery note number" {...field} disabled={isUploading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tanggal"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                              disabled={isUploading}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Surat Jalan</FormLabel>
                      <FormControl>
                        <Input {...field} disabled readOnly className="bg-muted" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supir"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Supir *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isUploading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DRIVERS.map((driver) => (
                            <SelectItem key={driver} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="helper1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Helper 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} disabled={isUploading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="helper2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Helper 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} disabled={isUploading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-foreground mb-4">Upload Photos *</h3>
                  <FileUploadZone
                    files={files}
                    onFilesAdded={handleFilesAdded}
                    onFileRemoved={handleFileRemoved}
                    disabled={isUploading}
                  />
                </div>

                {isUploading && <UploadProgress files={files} />}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!isFormValid || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
