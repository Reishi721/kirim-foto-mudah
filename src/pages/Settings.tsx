import { Settings as SettingsIcon, Bell, Shield, Palette, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

export default function Settings() {
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
              <SettingsIcon className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">Manage your preferences</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-3 sm:px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Notifications Settings */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.22 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-brand" />
                  <div>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Configure how you receive notifications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="upload-notifications">Upload Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when uploads complete
                    </p>
                  </div>
                  <Switch id="upload-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="error-notifications">Error Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when errors occur
                    </p>
                  </div>
                  <Switch id="error-notifications" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.22 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-brand" />
                  <div>
                    <CardTitle>Privacy & Security</CardTitle>
                    <CardDescription>Manage your security preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Switch id="two-factor" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="session-timeout">Auto Logout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically logout after inactivity
                    </p>
                  </div>
                  <Switch id="session-timeout" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.22 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-brand" />
                  <div>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize how the app looks</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle dark mode theme
                    </p>
                  </div>
                  <Switch id="dark-mode" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-view">Compact View</Label>
                    <p className="text-sm text-muted-foreground">
                      Use a more compact layout
                    </p>
                  </div>
                  <Switch id="compact-view" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data & Storage */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.22 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-brand" />
                  <div>
                    <CardTitle>Data & Storage</CardTitle>
                    <CardDescription>Manage your data and storage</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="offline-mode">Offline Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable offline data access
                    </p>
                  </div>
                  <Switch id="offline-mode" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-backup">Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically backup your data
                    </p>
                  </div>
                  <Switch id="auto-backup" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
