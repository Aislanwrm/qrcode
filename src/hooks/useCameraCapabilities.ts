import { useState, useRef } from 'react';
import { toast } from 'sonner';

export const useCameraCapabilities = () => {
  const [flashSupported, setFlashSupported] = useState(false);
  const [focusSupported, setFocusSupported] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<string[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const checkCameraCapabilities = async () => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack || !('getCapabilities' in videoTrack)) return;

    try {
      const capabilities = (videoTrack as any).getCapabilities();
      console.log('Capacidades completas da câmera:', capabilities);
      
      // Verificar suporte ao flash/torch
      const hasFlash = capabilities.torch || 
                      (capabilities.fillLightMode && capabilities.fillLightMode.includes('flash'));
      setFlashSupported(hasFlash);
      
      // Verificar suporte ao foco
      const hasFocus = capabilities.focusMode && capabilities.focusMode.length > 0;
      setFocusSupported(hasFocus);
      
      console.log('Flash suportado:', hasFlash);
      console.log('Foco suportado:', hasFocus);
      
      if (!hasFlash) {
        toast.info('Flash não disponível neste dispositivo');
      }
      
    } catch (error) {
      console.log('Erro ao verificar capacidades:', error);
    }
  };

  const listAvailableCameras = async () => {
    try {
      const QrScanner = (await import('qr-scanner')).default;
      const cameras = await QrScanner.listCameras(true);
      console.log('Câmeras disponíveis:', cameras);
      setAvailableCameras(cameras.map(cam => cam.id));
    } catch (error) {
      console.log('Erro ao listar câmeras:', error);
    }
  };

  return {
    flashSupported,
    focusSupported,
    availableCameras,
    streamRef,
    checkCameraCapabilities,
    listAvailableCameras
  };
};