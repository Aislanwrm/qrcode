import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, QrCode, ZoomIn, ZoomOut, Flashlight, FlashlightOff } from 'lucide-react';
import { toast } from 'sonner';
import QrScanner from 'qr-scanner';
import { useCupomFiscal } from '@/hooks/useCupomFiscal';
import { parseNFCeURL, detectDataType } from '@/utils/nfceParser';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QRScannerProps {
  onDataScanned: () => void;
}

const QRScannerComponent: React.FC<QRScannerProps> = ({ onDataScanned }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [pendingData, setPendingData] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { saveCupom } = useCupomFiscal();
  const { user } = useAuth();

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
        (result) => {
          console.log('QR Code detectado:', result.data);
          setScannedData(result.data);
          saveScannedData(result.data);
          stopScanning();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 5,
        }
      );
      
      console.log('Iniciando scanner...');
      await qrScannerRef.current.start();
      
      if (video.srcObject instanceof MediaStream) {
        streamRef.current = video.srcObject;
        await applyZoom(zoomLevel);
      }
      
      setTimeout(() => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          console.log('Vídeo carregado com dimensões:', video.videoWidth, 'x', video.videoHeight);
        } else {
          console.warn('Vídeo não possui dimensões válidas');
          video.play().catch(console.error);
        }
      }, 1000);
      
      setIsScanning(true);
      console.log('Scanner iniciado com sucesso');
      toast.success('Scanner iniciado! Toque na tela para focar');
      
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
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.style.display = 'none';
    }
    
    setIsScanning(false);
    setCameraError('');
    setFlashEnabled(false);
    console.log('Scanner parado');
  };

  const applyZoom = async (zoom: number) => {
    if (!streamRef.current || !videoRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    
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

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    
    if (videoTrack && 'getCapabilities' in videoTrack) {
      try {
        const capabilities = (videoTrack as any).getCapabilities();
        if (capabilities.torch) {
          await (videoTrack as any).applyConstraints({
            advanced: [{ torch: !flashEnabled }]
          });
          setFlashEnabled(!flashEnabled);
          toast.success(flashEnabled ? 'Flash desligado' : 'Flash ligado');
          return;
        }
      } catch (error) {
        console.log('Flash nativo não suportado:', error);
      }
    }
    
    toast.error('Flash não disponível neste dispositivo');
  };

  const handleVideoClick = async (event: React.MouseEvent<HTMLVideoElement>) => {
    if (!streamRef.current || !videoRef.current) return;

    const rect = videoRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    
    if (videoTrack && 'getCapabilities' in videoTrack) {
      try {
        const capabilities = (videoTrack as any).getCapabilities();
        if (capabilities.focusMode) {
          await (videoTrack as any).applyConstraints({
            advanced: [{
              focusMode: 'single-shot',
              pointsOfInterest: [{ x, y }]
            }]
          });
          console.log(`Foco aplicado em: ${x}, ${y}`);
          toast.success('Foco aplicado!');
          return;
        }
      } catch (error) {
        console.log('Foco por toque não suportado:', error);
      }
    }
    
    toast.success('Toque registrado - tentando focar');
  };

  const saveScannedData = async (content: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const dataType = detectDataType(content);
    
    try {
      if (dataType === 'NFC-e') {
        // Tentar extrair dados da NFC-e
        toast.info('Processando dados da NFC-e...');
        const nfceData = await parseNFCeURL(content);
        const success = await saveCupom(nfceData);
        if (success) {
          onDataScanned();
        }
      } else {
        // Para outros tipos de QR, salvar como cupom simples
        const cupomData = {
          qr_content: content,
          empresa_nome: `QR Code ${dataType}`,
          data_emissao: new Date().toISOString().split('T')[0],
          hora_emissao: new Date().toTimeString().split(' ')[0]
        };
        
        const success = await saveCupom(cupomData);
        if (success) {
          onDataScanned();
        }
      }
    } catch (error) {
      console.error('Erro ao processar QR code:', error);
      toast.error('Erro ao processar QR code');
    }
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <QrCode className="w-6 h-6 text-blue-600" />
            Scanner QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full max-w-md mx-auto">
            <video
              ref={videoRef}
              className="w-full h-64 bg-gray-900 rounded-lg shadow-lg object-cover cursor-pointer"
              style={{ 
                display: isScanning ? 'block' : 'none',
                width: '100%',
                height: '256px',
                visibility: 'visible'
              }}
              playsInline
              muted
              autoPlay
              onClick={handleVideoClick}
            />
            {!isScanning && (
              <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Clique para iniciar o scanner</p>
                </div>
              </div>
            )}

            {/* Controles de câmera */}
            {isScanning && (
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleFlash}
                  className="w-10 h-10 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                >
                  {flashEnabled ? 
                    <FlashlightOff className="w-4 h-4" /> : 
                    <Flashlight className="w-4 h-4" />
                  }
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleZoomIn}
                  className="w-10 h-10 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleZoomOut}
                  className="w-10 h-10 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Indicador de zoom */}
            {isScanning && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {zoomLevel}x
              </div>
            )}
          </div>

          {cameraError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{cameraError}</p>
            </div>
          )}

          <div className="flex justify-center">
            {!isScanning ? (
              <Button 
                onClick={startScanning}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-full transition-all duration-200 transform hover:scale-105"
              >
                <Camera className="w-5 h-5 mr-2" />
                Iniciar Scanner
              </Button>
            ) : (
              <Button 
                onClick={stopScanning}
                variant="destructive"
                className="px-8 py-3 rounded-full transition-all duration-200 transform hover:scale-105"
              >
                Parar Scanner
              </Button>
            )}
          </div>

          {isScanning && (
            <div className="text-center text-sm text-gray-600">
              <p>Toque na tela para focar • Use os botões para zoom e flash</p>
            </div>
          )}

          {scannedData && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Último QR code escaneado:</h3>
              <p className="text-green-700 break-all">{scannedData}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScannerComponent;
