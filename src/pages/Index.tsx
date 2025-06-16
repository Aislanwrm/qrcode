
import React, { useState } from 'react';
import QRScanner from '@/components/QRScanner';
import DataList from '@/components/DataList';
import DataViewer from '@/components/DataViewer';
import ExportData from '@/components/ExportData';
import Settings from '@/components/Settings';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Database, Download, Settings as SettingsIcon, Search, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { signOut, user } = useAuth();

  const handleDataChanged = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao fazer logout');
    } else {
      toast.success('Logout realizado com sucesso!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              QR Scanner Pro
            </h1>
            <p className="text-gray-600 mt-2">
              Bem-vindo, {user?.email}
            </p>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="viewer" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Visualizar
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner">
            <QRScanner onDataScanned={handleDataChanged} />
          </TabsContent>

          <TabsContent value="data">
            <DataList onDataChanged={handleDataChanged} key={refreshTrigger} />
          </TabsContent>

          <TabsContent value="viewer">
            <DataViewer />
          </TabsContent>

          <TabsContent value="export">
            <ExportData />
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
