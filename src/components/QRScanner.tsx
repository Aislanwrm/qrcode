import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useCupomFiscal } from '@/hooks/useCupomFiscal';
import { parseNFCeURL, detectDataType } from '@/utils/nfceParser';
import { useAuth } from '@/hooks/useAuth';
import { useCameraCapabilities } from '@/hooks/useCameraCapabilities';
import { useQRScanner } from '@/hooks/useQRScanner';
import { useFlashControl } from '@/hooks/useFlashControl';
import CameraControls from '@/components/CameraControls';
import ScannerStatusIndicators from '@/components/ScannerStatusIndicators';

interface QRScannerProps {
  onDataScanned: () => void;
}

const QRScannerComponent: React.FC<QRScannerProps> = ({ onDataScanned }) => {
  const [scannedData, setScannedData] = useState<string>('');
  const [currentCamera, setCurrentCamera] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { saveCupom } = useCupomFiscal();
  const { user } = useAuth();

  const {
    flashSupported,
    focusSupported,
    availableCameras,
    streamRef,
    checkCameraCapabilities,
    listAvailableCameras
  } = useCameraCapabilities();

  const { flashEnabled, toggleFlash, setFlashEnabled } = useFlashControl(streamRef, flashSupported);

  const {
    isScanning,
    cameraError,
    zoomLevel,
    videoRef,
    startScanning,
    stopScanning,
    handleZoomIn,
    handleZoomOut
  } = useQRScanner({
    onDataScanned: saveScannedData,
    onStreamReady: (stream) => {
      streamRef.current = stream;
      checkCameraCapabilities();
      listAvailableCameras();
    },
    currentCamera
  });

  const switchCamera = async () => {
    if (availableCameras.length < 2) {
      toast.error('Apenas uma câmera disponível');
      return;
    }

    const newCamera = currentCamera === 'environment' ? 'user' : 'environment';
    setCurrentCamera(newCamera);
    
    if (isScanning) {
      stopScanning();
      setTimeout(() => {
        startScanning();
      }, 500);
    }
    
    toast.success(`Alternando para câmera ${newCamera === 'environment' ? 'traseira' : 'frontal'}`);
  };

  const handleVideoClick = async (event: React.MouseEvent<HTMLVideoElement>) => {
    if (!focusSupported) {
      const video = videoRef.current;
      if (video) {
        video.style.filter = 'brightness(1.2)';
        setTimeout(() => {
          video.style.filter = 'brightness(1)';
        }, 200);
      }
      toast.info('Foco automático não disponível - QR posicionado na área central');
      return;
    }

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
  };

  async function saveScannedData(content: string) {
    console.log('=== INÍCIO DO PROCESSAMENTO ===');
    console.log('Conteúdo escaneado:', content);
    
    if (!user) {
      console.log('Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return;
    }

    if (isProcessing) {
      console.log('Já processando outro QR code, ignorando...');
      return;
    }

    setIsProcessing(true);
    setScannedData(content);
    
    const dataType = detectDataType(content);
    console.log('Tipo de dados detectado:', dataType);
    
    try {
      if (dataType === 'NFC-e') {
        console.log('✅ Processando como NFC-e...');
        
        toast.info('Processando dados da NFC-e... Aguarde alguns segundos');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Chamando parseNFCeURL...');
        const nfceData = await parseNFCeURL(content);
        console.log('Dados extraídos da NFC-e:', nfceData);
        
        if (nfceData) {
          console.log('Dados extraídos com sucesso, verificando qualidade...');
          
          const hasEssentialData = nfceData.empresa_nome && 
                                   nfceData.empresa_nome !== 'Dados básicos do QR Code' &&
                                   nfceData.empresa_nome !== 'NFC-e (dados parciais)' &&
                                   nfceData.empresa_nome !== 'QR Code URL';
          
          console.log('Tem dados essenciais:', hasEssentialData);
          console.log('Nome da empresa:', nfceData.empresa_nome);
          
          if (hasEssentialData) {
            console.log('✅ Salvando dados completos...');
            const success = await saveCupom(nfceData);
            if (success) {
              toast.success('NFC-e processada e salva com sucesso!');
              onDataScanned();
            } else {
              toast.error('Erro ao salvar dados da NFC-e');
            }
          } else {
            console.log('⚠️ Dados incompletos, salvando dados básicos...');
            toast.warning('Dados da NFC-e extraídos parcialmente');
            
            const cupomBasico = {
              qr_content: content,
              chave_acesso: nfceData.chave_acesso || '',
              valor_total: nfceData.valor_total || 0,
              empresa_nome: 'NFC-e (dados parciais)',
              data_emissao: new Date().toISOString().split('T')[0],
              hora_emissao: new Date().toTimeString().split(' ')[0]
            };
            
            console.log('Salvando cupom básico:', cupomBasico);
            const success = await saveCupom(cupomBasico);
            if (success) {
              toast.success('QR code salvo com dados básicos');
              onDataScanned();
            }
          }
        } else {
          console.log('❌ Nenhum dado extraído da NFC-e');
          toast.error('Não foi possível extrair dados da NFC-e');
          
          const cupomBasico = {
            qr_content: content,
            empresa_nome: 'QR Code NFC-e',
            data_emissao: new Date().toISOString().split('T')[0],
            hora_emissao: new Date().toTimeString().split(' ')[0]
          };
          
          await saveCupom(cupomBasico);
          onDataScanned();
        }
      } else {
        console.log('❌ Processando QR code não-NFC-e como:', dataType);
        
        const cupomData = {
          qr_content: content,
          empresa_nome: `QR Code ${dataType}`,
          data_emissao: new Date().toISOString().split('T')[0],
          hora_emissao: new Date().toTimeString().split(' ')[0]
        };
        
        const success = await saveCupom(cupomData);
        if (success) {
          toast.success('QR code salvo com sucesso!');
          onDataScanned();
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar QR code:', error);
      toast.error('Erro ao processar QR code: ' + (error as Error).message);
    } finally {
      console.log('=== FIM DO PROCESSAMENTO ===');
      setIsProcessing(false);
    }
  }

  const handleStopScanning = () => {
    stopScanning();
    setFlashEnabled(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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

            {isScanning && (
              <>
                <CameraControls
                  flashEnabled={flashEnabled}
                  flashSupported={flashSupported}
                  onToggleFlash={toggleFlash}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onSwitchCamera={switchCamera}
                />
                <ScannerStatusIndicators
                  flashSupported={flashSupported}
                  focusSupported={focusSupported}
                  zoomLevel={zoomLevel}
                  isProcessing={isProcessing}
                />
              </>
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
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-full transition-all duration-200 transform hover:scale-105"
              >
                <Camera className="w-5 h-5 mr-2" />
                Iniciar Scanner
              </Button>
            ) : (
              <Button 
                onClick={handleStopScanning}
                variant="destructive"
                disabled={isProcessing}
                className="px-8 py-3 rounded-full transition-all duration-200 transform hover:scale-105"
              >
                Parar Scanner
              </Button>
            )}
          </div>

          {isScanning && (
            <div className="text-center text-sm text-gray-600 space-y-1">
              <p>
                {focusSupported 
                  ? "Toque na tela para focar" 
                  : "Posicione o QR code na área central"
                } • Use os botões para zoom
                {flashSupported && " e flash"}
              </p>
              <p className="text-xs text-gray-500">
                Câmera: {currentCamera === 'environment' ? 'Traseira' : 'Frontal'}
                {availableCameras.length > 1 && ' (toque para alternar)'}
              </p>
              {isProcessing && <p className="text-blue-600 font-medium">Processando dados da NFC-e...</p>}
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