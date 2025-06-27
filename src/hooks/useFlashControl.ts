import { useState } from 'react';
import { toast } from 'sonner';

export const useFlashControl = (streamRef: React.RefObject<MediaStream | null>, flashSupported: boolean) => {
  const [flashEnabled, setFlashEnabled] = useState(false);

  const toggleFlash = async () => {
    if (!flashSupported) {
      toast.error('Flash não disponível neste dispositivo');
      return;
    }

    if (!streamRef.current) {
      toast.error('Stream de vídeo não disponível');
      return;
    }

    const videoTrack = streamRef.current.getVideoTracks()[0];
    
    if (!videoTrack) {
      toast.error('Track de vídeo não disponível');
      return;
    }
    
    console.log('Tentando controlar flash...');
    
    try {
      const capabilities = (videoTrack as any).getCapabilities();
      console.log('Capacidades da câmera:', capabilities);
      
      if (capabilities.torch) {
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: !flashEnabled }]
        });
        setFlashEnabled(!flashEnabled);
        toast.success(flashEnabled ? 'Flash desligado' : 'Flash ligado');
        return;
      }
      
      if (capabilities.fillLightMode && capabilities.fillLightMode.includes('flash')) {
        await (videoTrack as any).applyConstraints({
          advanced: [{ fillLightMode: flashEnabled ? 'off' : 'flash' }]
        });
        setFlashEnabled(!flashEnabled);
        toast.success(flashEnabled ? 'Flash desligado' : 'Flash ligado');
        return;
      }

      console.log('Torch não suportado');
      console.log('Flash não suportado por este dispositivo/navegador');
      toast.error('Flash não suportado por este dispositivo/navegador');
      
    } catch (error) {
      console.error('Erro ao controlar flash:', error);
      toast.error('Erro ao controlar o flash');
    }
  };

  return {
    flashEnabled,
    toggleFlash,
    setFlashEnabled
  };
};