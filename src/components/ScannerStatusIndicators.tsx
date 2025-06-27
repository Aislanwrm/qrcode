import React from 'react';

interface ScannerStatusIndicatorsProps {
  flashSupported: boolean;
  focusSupported: boolean;
  zoomLevel: number;
  isProcessing: boolean;
}

const ScannerStatusIndicators: React.FC<ScannerStatusIndicatorsProps> = ({
  flashSupported,
  focusSupported,
  zoomLevel,
  isProcessing
}) => {
  return (
    <>
      {/* Status de funcionalidades */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        <div className={`px-2 py-1 rounded text-xs ${flashSupported ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
          Flash: {flashSupported ? 'OK' : 'N/A'}
        </div>
        <div className={`px-2 py-1 rounded text-xs ${focusSupported ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
          Foco: {focusSupported ? 'OK' : 'N/A'}
        </div>
      </div>

      {/* Indicador de zoom */}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
        {zoomLevel}x
      </div>

      {/* Indicador de processamento */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Processando NFC-e...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ScannerStatusIndicators;