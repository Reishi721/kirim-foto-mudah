import { useState, useEffect } from 'react';
import { User, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Profile() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        setCreatedAt(user.created_at);
      }
    };
    getUser();
  }, []);

  const getInitials = () => {
    if (!userEmail) return 'U';
    return userEmail.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="relative overflow-hidden glass-card mb-6 sm:mb-10"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand" />
        <div className="container mx-auto px-4 py-6 sm:py-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-primary shadow-elegant hover-lift">
              <User className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">Manage your account information</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-3 sm:px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.22 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-brand/20 text-brand text-2xl font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>User Profile</CardTitle>
                    <CardDescription>Your account details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Email Address</p>
                      <p className="text-sm text-muted-foreground">{userEmail || 'Loading...'}</p>
                    </div>
                    <Badge variant="secondary">Primary</Badge>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Member Since</p>
                      <p className="text-sm text-muted-foreground">
                        {createdAt ? format(new Date(createdAt), 'MMMM d, yyyy') : 'Loading...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Additional profile features and settings will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
