import { useState, useRef } from 'react';
import { Camera, X, FlipHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  open: boolean;
}

export function CameraCapture({ onCapture, onClose, open }: CameraCaptureProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setIsLoading(false);
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera', {
        description: 'Please grant camera permissions in your browser settings',
      });
      setIsLoading(false);
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      blob => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          onCapture(file);
          stopCamera();
          onClose();
        }
      },
      'image/jpeg',
      0.95
    );
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    setTimeout(() => startCamera(), 100);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Start camera when dialog opens
  useState(() => {
    if (open && !stream) {
      startCamera();
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Take Photo</span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black">
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px] md:h-[600px]">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-[400px] md:h-[600px] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20"
                    onClick={switchCamera}
                  >
                    <FlipHorizontal className="h-5 w-5 text-white" />
                  </Button>

                  <Button
                    size="lg"
                    onClick={handleCapture}
                    className="h-16 w-16 rounded-full bg-white hover:bg-white/90 shadow-lg"
                  >
                    <Camera className="h-6 w-6 text-black" />
                  </Button>

                  <div className="w-12" /> {/* Spacer for alignment */}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
