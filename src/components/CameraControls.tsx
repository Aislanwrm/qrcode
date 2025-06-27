import React from 'react';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Flashlight, FlashlightOff, RotateCcw } from 'lucide-react';

interface CameraControlsProps {
  flashEnabled: boolean;
  flashSupported: boolean;
  onToggleFlash: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSwitchCamera: () => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  flashEnabled,
  flashSupported,
  onToggleFlash,
  onZoomIn,
  onZoomOut,
  onSwitchCamera
}) => {
  return (
    <div className="absolute top-2 right-2 flex flex-col gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={onSwitchCamera}
        className="w-10 h-10 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
        title="Alternar câmera"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={onToggleFlash}
        disabled={!flashSupported}
        className={`w-10 h-10 p-0 rounded-full ${flashSupported ? 'bg-black/50 hover:bg-black/70' : 'bg-gray-400/50'} text-white border-0`}
        title={flashSupported ? "Controlar flash" : "Flash não disponível"}
      >
        {flashEnabled ? 
          <FlashlightOff className="w-4 h-4" /> : 
          <Flashlight className="w-4 h-4" />
        }
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={onZoomIn}
        className="w-10 h-10 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
        title="Aumentar zoom"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={onZoomOut}
        className="w-10 h-10 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
        title="Diminuir zoom"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default CameraControls;