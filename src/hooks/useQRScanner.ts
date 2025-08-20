import { useState, useRef } from 'react';
import { toast } from 'sonner';
import QrScanner from 'qr-scanner';
//import QrScannerWorkerPath from 'qr-scanner/qr-scanner-worker.min.js?url'

interface UseQRScannerProps {
  onDataScanned: (data: string) => void;
  onStreamReady: (stream: MediaStream) => void;
  currentCamera: 'environment' | 'user';
}

export const useQRScanner = ({ onDataScanned, onStreamReady, currentCamera }: UseQRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(2);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const applyZoom = async (zoom: number) => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream || !videoRef.current) return;

    const videoTrack = stream.getVideoTracks()[0];
    
    if (videoTrack && 'getCapabilities' in videoTrack) {
      try {
        const capabilities = (videoTrack as any).getCapabilities();
        if (capabilities.zoom) {
          await (videoTrack as any).applyConstraints({
            advanced: [{ zoom: zoom }]
          });
          console.log(`Zoom nativo aplicado: ${zoom}x`);
          return;
        }
      } catch (error) {
        console.log('Zoom nativo não suportado:', error);
      }
    }
    
    videoRef.current.style.transform = `scale(${zoom})`;
    videoRef.current.style.transformOrigin = 'center';
    console.log(`Zoom CSS aplicado: ${zoom}x`);
  };

  const handleZoomIn = async () => {
    const newZoom = Math.min(zoomLevel + 0.5, 5);
    setZoomLevel(newZoom);
    await applyZoom(newZoom);
  };

  const handleZoomOut = async () => {
    const newZoom = Math.max(zoomLevel - 0.5, 1);
    setZoomLevel(newZoom);
    await applyZoom(newZoom);
  };

  const startScanning = async () => {
    try {
      setCameraError('');
      console.log('Iniciando scanner...');
      
      if (!videoRef.current) {
        console.error('Video element não encontrado');
        toast.error('Erro: elemento de vídeo não encontrado');
        return;
      }

      const hasCamera = await QrScanner.hasCamera();
      console.log('Dispositivo tem câmera:', hasCamera);
      
      if (!hasCamera) {
        toast.error('Nenhuma câmera encontrada no dispositivo');
        return;
      }

      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }

      console.log('Criando novo QrScanner...');
      
      const video = videoRef.current;
      video.style.display = 'block';
      video.style.visibility = 'visible';
      video.style.opacity = '1';
      
qrScannerRef.current = new QrScanner(
  video,
  {
    // Callback de sucesso
    onDecode: (result) => {
      console.log('QR Code detectado:', result.data);
      if (qrScannerRef.current) {
        qrScannerRef.current.pause();
      }
      onDataScanned(result.data);
    },

    // Opções básicas
    highlightScanRegion: true,
    highlightCodeOutline: true,
    preferredCamera: currentCamera,
    maxScansPerSecond: 1,

    // Apenas a otimização da região de escaneamento
    calculateScanRegion: (video) => {
      // Foca a análise em um quadrado de 70% no centro do vídeo
      const regionSize = Math.round(0.7 * Math.min(video.videoWidth, video.videoHeight));
      return {
        x: Math.round((video.videoWidth - regionSize) / 2),
        y: Math.round((video.videoHeight - regionSize) / 2),
        width: regionSize,
        height: regionSize,
      };
    },
  }
);
      
      console.log('Iniciando scanner...');
      await qrScannerRef.current.start();
      
      if (video.srcObject instanceof MediaStream) {
        onStreamReady(video.srcObject);
        await applyZoom(zoomLevel);
      }
      
      setTimeout(() => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          console.log('Vídeo carregado com dimensões:', video.videoWidth, 'x', video.videoHeight);
          toast.success('Scanner iniciado! Posicione o QR code na área central');
        } else {
          console.warn('Vídeo não possui dimensões válidas');
          video.play().catch(console.error);
        }
      }, 1000);
      
      setIsScanning(true);
      console.log('Scanner iniciado com sucesso');
      
    } catch (error) {
      console.error('Erro detalhado ao iniciar scanner:', error);
      setCameraError(`Erro ao acessar a câmera: ${error}`);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Permissão de câmera negada. Permita o acesso à câmera.');
        } else if (error.name === 'NotFoundError') {
          toast.error('Câmera não encontrada no dispositivo.');
        } else if (error.name === 'NotSupportedError') {
          toast.error('Câmera não suportada neste navegador.');
        } else {
          toast.error(`Erro ao acessar a câmera: ${error.message}`);
        }
      } else {
        toast.error('Erro desconhecido ao acessar a câmera');
      }
      
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    console.log('Parando scanner...');
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (videoRef.current) {
      videoRef.current.style.display = 'none';
    }
    
    setIsScanning(false);
    setCameraError('');
    console.log('Scanner parado');
  };

  return {
    isScanning,
    cameraError,
    zoomLevel,
    videoRef,
    startScanning,
    stopScanning,
    handleZoomIn,
    handleZoomOut
  };
};