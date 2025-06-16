
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserSettings {
  auto_parse_nfce: boolean;
  backup_enabled: boolean;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    auto_parse_nfce: true,
    backup_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          auto_parse_nfce: data.auto_parse_nfce,
          backup_enabled: data.backup_enabled
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          auto_parse_nfce: settings.auto_parse_nfce,
          backup_enabled: settings.backup_enabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao fazer logout');
    } else {
      toast.success('Logout realizado com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Configurações
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Análise automática de NFC-e</Label>
                <p className="text-sm text-gray-500">
                  Tentar buscar dados automaticamente ao escanear QR codes de NFC-e
                </p>
              </div>
              <Switch
                checked={settings.auto_parse_nfce}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, auto_parse_nfce: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Backup automático</Label>
                <p className="text-sm text-gray-500">
                  Manter backup dos dados no sistema
                </p>
              </div>
              <Switch
                checked={settings.backup_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, backup_enabled: checked }))
                }
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={saveSettings}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>

          <hr className="border-gray-200" />

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Conta</h3>
            <p className="text-sm text-gray-500">Email: {user?.email}</p>
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
