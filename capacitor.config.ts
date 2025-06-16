
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.abb58d9378a54ccc8417fca39d2578ce',
  appName: 'QR Scanner Pro',
  webDir: 'dist',
  server: {
    url: 'https://abb58d93-78a5-4ccc-8417-fca39d2578ce.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ["camera"]
    }
  }
};

export default config;
