import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Upload as UploadIcon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function Upload() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string>('');

  const form = useForm<UploadFormData>({
    resolver: zodResolver(UploadFormSchema),
    defaultValues: {
      tipe: 'Pengiriman',
      noSuratJalan: '',
      helper1: '',
      helper2: '',
      description: '',
    },
  });

  const handleFilesAdded = (newFiles: FileWithProgress[]) => {
    setFiles((prev) => {
      const existingIds = new Set(prev.map((f) => f.id));
      const uniqueNewFiles = newFiles.filter((f) => !existingIds.has(f.id));
      
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

  const triggerConfetti = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 20, spread: 360, ticks: 50, zIndex: 0 };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 30 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.3 + 0.35, y: Math.random() * 0.2 + 0.3 }
      });
    }, 250);
  };

  const onSubmit = async (data: UploadFormData) => {
    if (files.length === 0) {
      toast.error('Please select at least one file to upload', {
        description: 'Add photos before uploading'
      });
      return;
    }

    setIsUploading(true);
    const folderPath = buildUploadPath({
      noSuratJalan: data.noSuratJalan,
      tanggal: data.tanggal,
      tipe: data.tipe,
    });

    try {
      let successCount = 0;
      let failCount = 0;

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
          failCount++;
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, status: 'error', error: uploadError.message }
                : f
            )
          );
        } else {
          successCount++;
          setFiles((prev) =>
            prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'success', progress: 100 } : f))
          );
        }
      }

      // Save metadata to database only if at least one file succeeded
      if (successCount > 0) {
        const { data: user } = await supabase.auth.getUser();
        
        const { error: dbError } = await supabase.from('upload_records').insert({
          no_surat_jalan: data.noSuratJalan,
          tanggal: formatDateISO(data.tanggal),
          tipe: data.tipe,
          supir: data.supir,
          helper1: data.helper1 || '—',
          helper2: data.helper2 || '—',
          description: data.description || null,
          folder_path: folderPath,
          file_count: successCount,
          user_id: user.user?.id,
        });

        if (dbError) {
          toast.error('Failed to save metadata', {
            description: dbError.message
          });
        } else {
          setUploadedPath(folderPath);
          triggerConfetti();
          
          toast.success(`Upload complete!`, {
            description: `Successfully uploaded ${successCount} of ${files.length} files`,
            action: {
              label: 'Open Folder',
              onClick: () => navigate(`/browse?folder=${encodeURIComponent(folderPath)}`)
            },
            icon: <CheckCircle2 className="h-5 w-5" />,
          });
          
          // Reset form after a short delay
          setTimeout(() => {
            form.reset();
            setFiles([]);
            setUploadedPath('');
          }, 1500);
        }
      } else {
        toast.error('Upload failed', {
          description: 'All files failed to upload. Please try again.'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isFormValid = form.formState.isValid && files.length > 0 && !isUploading;
  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'success').length;
  const overallProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="relative overflow-hidden glass-card mb-8"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-brand opacity-60" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
              <UploadIcon className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-display font-bold">Upload Photos</h1>
              <p className="text-base text-muted-foreground mt-1">Fast delivery documentation</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Form Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.22 }}
              >
                <Card className="p-6 md:p-8">
                  <h2 className="font-semibold mb-6">Delivery Information</h2>
                  
                  <div className="space-y-6">
                    {/* Document Number */}
                    <FormField
                      control={form.control}
                      name="noSuratJalan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Document Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. SJ-2025-001" 
                              className="h-11"
                              {...field} 
                              disabled={isUploading} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Enter the delivery note number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tanggal */}
                    <FormField
                      control={form.control}
                      name="tanggal"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-base">Tanggal *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'h-11 w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                  disabled={isUploading}
                                >
                                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 glass-card" align="start">
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

                    {/* Document Type */}
                    <FormField
                      control={form.control}
                      name="tipe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Document Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isUploading}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass-card">
                              <SelectItem value="Pengiriman">Pengiriman</SelectItem>
                              <SelectItem value="Pengembalian">Pengembalian</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Supir */}
                    <FormField
                      control={form.control}
                      name="supir"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Supir *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isUploading}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select driver" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass-card">
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

                    {/* Helpers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="helper1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Helper 1</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Optional" 
                                className="h-11"
                                {...field} 
                                disabled={isUploading} 
                              />
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
                            <FormLabel className="text-base">Helper 2</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Optional" 
                                className="h-11"
                                {...field} 
                                disabled={isUploading} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add notes or description about this delivery (optional)" 
                              className="resize-none min-h-[100px]" 
                              {...field} 
                              disabled={isUploading} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Max 500 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              </motion.div>

              {/* Upload Zone */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.22 }}
              >
                <Card className="p-6 md:p-8">
                  <h2 className="font-semibold mb-6">Upload Pictures *</h2>
                  <FileUploadZone
                    files={files}
                    onFilesAdded={handleFilesAdded}
                    onFileRemoved={handleFileRemoved}
                    disabled={isUploading}
                  />
                </Card>
              </motion.div>

              {/* Upload Progress */}
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                  >
                    <UploadProgress files={files} />
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 shadow-float"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="max-w-3xl mx-auto flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                      <UploadIcon className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {isUploading ? `Uploading... ${Math.round(overallProgress)}%` : `${files.length} file${files.length !== 1 ? 's' : ''} ready`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isUploading ? `${completedFiles} of ${totalFiles} completed` : 'Click Upload to continue'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={!isFormValid}
                  size="lg"
                  className="shadow-soft"
                >
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
