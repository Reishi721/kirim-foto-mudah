import { useState, useEffect } from 'react';
import { Download, Check, Smartphone, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import scaffoldingLogo from '@/assets/scaffolding-logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
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
              <Download className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Install App
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Get quick access from your home screen
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-3 sm:px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Installation Status */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.22 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={scaffoldingLogo} alt="App Logo" className="h-12 w-12 rounded-xl" />
                    <div>
                      <CardTitle>Documenting System</CardTitle>
                      <CardDescription>Progressive Web App</CardDescription>
                    </div>
                  </div>
                  {isInstalled && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Installed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isStandalone ? (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-success mb-1">App is installed!</p>
                        <p className="text-sm text-muted-foreground">
                          You're already using the installed version. Enjoy offline access and home screen convenience!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : deferredPrompt ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Install this app on your device for quick access and offline support. No app store required!
                    </p>
                    <Button onClick={handleInstallClick} className="w-full" size="lg">
                      <Download className="mr-2 h-5 w-5" />
                      Install Now
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      To install this app on your device:
                    </p>
                    
                    {/* iOS Instructions */}
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        iPhone / iPad (Safari)
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal">
                        <li>Tap the Share button (square with arrow)</li>
                        <li>Scroll and tap "Add to Home Screen"</li>
                        <li>Tap "Add" in the top right corner</li>
                      </ol>
                    </div>

                    {/* Android Instructions */}
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Android (Chrome)
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal">
                        <li>Tap the menu (three dots) in the top right</li>
                        <li>Tap "Install app" or "Add to Home Screen"</li>
                        <li>Tap "Install" to confirm</li>
                      </ol>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.22 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Why Install?</CardTitle>
                <CardDescription>Benefits of the installed app</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-brand/10 flex-shrink-0">
                      <Wifi className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Works Offline</p>
                      <p className="text-xs text-muted-foreground">
                        Access your data and queue uploads even without internet
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-brand/10 flex-shrink-0">
                      <Smartphone className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Quick Access</p>
                      <p className="text-xs text-muted-foreground">
                        Launch directly from your home screen like a native app
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-brand/10 flex-shrink-0">
                      <Download className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Automatic Updates</p>
                      <p className="text-xs text-muted-foreground">
                        Always get the latest features without manual updates
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
