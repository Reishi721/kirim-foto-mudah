import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Trash2, ImageOff, Loader2, ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RetentionPolicies } from '@/components/admin/RetentionPolicies';
import { UserManagement } from '@/components/admin/UserManagement';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  upload_count: number;
  roles: string[];
}

interface UploadRecord {
  id: string;
  no_surat_jalan: string;
  tanggal: string;
  tipe: string;
  supir: string;
  file_count: number;
  folder_path: string;
  created_at: string;
  user_id: string;
}

interface Photo {
  name: string;
  id: string;
  metadata: Record<string, any>;
}

export default function Admin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [photos, setPhotos] = useState<{ [key: string]: Photo[] }>({});
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'photo'; id: string; extra?: any } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please login to access admin dashboard');
        navigate('/login');
        return;
      }

      // Check if user is admin using the security definer function
      const { data: isAdminResult, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        toast.error('Failed to verify admin access');
        navigate('/');
        return;
      }

      if (!isAdminResult) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to verify access');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_users' }
      });

      if (usersError) throw usersError;
      if (usersData?.users) {
        setUsers(usersData.users);
      }

      // Load upload records
      const { data: recordsData, error: recordsError } = await supabase
        .from('upload_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;
      setRecords(recordsData || []);

      // Load photos for each record
      if (recordsData) {
        const photosMap: { [key: string]: Photo[] } = {};
        
        for (const record of recordsData) {
          const { data: files } = await supabase.storage
            .from('surat-jalan-uploads')
            .list(record.folder_path);
          
          if (files) {
            photosMap[record.id] = files;
          }
        }
        
        setPhotos(photosMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'delete_user',
          userId: userId
        }
      });

      if (error) throw error;

      toast.success('User deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDeletePhoto = async (recordId: string, filePath: string, fileName: string) => {
    setIsDeleting(true);
    try {
      const fullPath = `${filePath}/${fileName}`;
      
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'delete_photo',
          filePath: fullPath,
          recordId: recordId
        }
      });

      if (error) throw error;

      toast.success('Photo deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <div className="glass-card mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary opacity-60" />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 space-y-8">
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden glass-card mb-8"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary opacity-60" />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-soft"
                >
                  <Shield className="h-7 w-7 text-primary-foreground" />
                </motion.div>
                <div>
                  <h1 className="text-display font-bold">Admin Dashboard</h1>
                  <p className="text-base text-muted-foreground mt-1">Manage users and content</p>
                </div>
              </div>
              <Button onClick={() => navigate('/')} variant="outline" className="hover-lift">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="container mx-auto px-4 space-y-8">
          {/* Users Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3 }}
          >
            <Card className="p-6 hover-lift">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Users ({users.length})</h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manage user accounts and permissions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <UserManagement onUserCreated={loadData} />
              </div>

              {users.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Users Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first user account to get started</p>
                  <UserManagement onUserCreated={loadData} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Uploads</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Sign In</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.roles.map(role => (
                                <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{user.upload_count}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.created_at), 'PPP')}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'PPP') : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteTarget({ type: 'user', id: user.id, extra: user })}
                                  disabled={user.roles.includes('admin')}
                                  className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{user.roles.includes('admin') ? 'Cannot delete admin users' : 'Delete user and all their data'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Photos Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.3 }}
          >
            <Card className="p-6 hover-lift">
              <div className="flex items-center gap-3 mb-6">
                <ImageOff className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Upload Records ({records.length})</h2>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View and manage all uploaded photos</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {records.length === 0 ? (
                <div className="text-center py-16">
                  <ImageOff className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upload Records</h3>
                  <p className="text-muted-foreground mb-4">Users' uploaded photos will appear here once they start uploading</p>
                  <Button onClick={() => navigate('/upload')} variant="outline">
                    Go to Upload
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {records.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className="p-4 rounded-xl bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-lg">{record.no_surat_jalan}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>{record.tipe}</span>
                            <span>•</span>
                            <span>{record.supir}</span>
                            <span>•</span>
                            <span>{format(new Date(record.tanggal), 'PPP')}</span>
                          </div>
                        </div>
                        <Badge variant="secondary">{record.file_count} files</Badge>
                      </div>

                      {photos[record.id] && photos[record.id].length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {photos[record.id].map((photo) => (
                            <motion.div
                              key={photo.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className="relative group"
                            >
                              <div className="aspect-square rounded-lg overflow-hidden glass-card">
                                <img
                                  src={`${supabase.storage.from('surat-jalan-uploads').getPublicUrl(`${record.folder_path}/${photo.name}`).data.publicUrl}`}
                                  alt={photo.name}
                                  className="w-full h-full object-cover transition-transform duration-220 group-hover:scale-105"
                                />
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all shadow-soft hover:scale-110"
                                    onClick={() => setDeleteTarget({ 
                                      type: 'photo', 
                                      id: photo.id, 
                                      extra: { recordId: record.id, filePath: record.folder_path, fileName: photo.name }
                                    })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete this photo permanently</p>
                                </TooltipContent>
                              </Tooltip>
                              <p className="text-xs text-muted-foreground mt-1 truncate">{photo.name}</p>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <ImageOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No photos in this record</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Retention Policies */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.3 }}
          >
            <RetentionPolicies />
          </motion.div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {deleteTarget && (
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
              <AlertDialogContent className="glass-card">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base">
                      {deleteTarget?.type === 'user' && (
                        <>
                          Are you sure you want to delete user <strong>{deleteTarget.extra?.email}</strong>? 
                          This will permanently delete their account, all upload records, and associated photos. 
                          <br /><br />
                          <span className="text-destructive font-medium">⚠️ This action cannot be undone.</span>
                        </>
                      )}
                      {deleteTarget?.type === 'photo' && (
                        <>
                          Are you sure you want to delete this photo?
                          <br /><br />
                          <span className="text-destructive font-medium">⚠️ This action cannot be undone.</span>
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} className="hover-lift">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (deleteTarget?.type === 'user') {
                          handleDeleteUser(deleteTarget.id);
                        } else if (deleteTarget?.type === 'photo') {
                          handleDeletePhoto(
                            deleteTarget.extra.recordId,
                            deleteTarget.extra.filePath,
                            deleteTarget.extra.fileName
                          );
                        }
                      }}
                      disabled={isDeleting}
                      className="bg-destructive hover:bg-destructive/90 hover-lift"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </motion.div>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
