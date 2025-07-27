
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Database } from 'lucide-react';
import { toast } from 'sonner';
import { useCupomFiscal, CupomFiscal } from '@/hooks/useCupomFiscal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ExportData: React.FC = () => {
  const { cupons, loading } = useCupomFiscal();
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const { user } = useAuth();

  const toggleSelection = (id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === cupons.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cupons.map(item => item.id!).filter(id => id)));
    }
  };

  const getSelectedData = () => {
    if (selectedItems.size === 0) {
      return cupons;
    }
    return cupons.filter(item => selectedItems.has(item.id!));
  };

  const exportToTxt = () => {
    const dataToExport = getSelectedData();
    if (dataToExport.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const content = dataToExport.map(item => {
      return `Data: ${item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : 'N/A'}
Empresa: ${item.empresa_nome || 'N/A'}
CNPJ: ${item.empresa_cnpj || 'N/A'}
Chave de Acesso: ${item.chave_acesso || 'N/A'}
Valor Total: R$ ${item.valor_total?.toFixed(2) || '0,00'}
Valor Pago: R$ ${item.valor_pago?.toFixed(2) || '0,00'}
Conteúdo QR: ${item.qr_content}
${'-'.repeat(50)}`;
    }).join('\n\n');

    downloadFile(content, 'cupons-fiscais.txt', 'text/plain');
    toast.success(`${dataToExport.length} cupons exportados para TXT!`);
  };

  const exportToCsv = () => {
    const dataToExport = getSelectedData();
    if (dataToExport.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = 'ID,Data,Empresa,CNPJ,Chave Acesso,Valor Total,QR Content\n';
    const csvContent = dataToExport.map(item => {
      const timestamp = item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : 'N/A';
      const empresa = `"${(item.empresa_nome || 'N/A').replace(/"/g, '""')}"`;
      const qrContent = `"${item.qr_content.replace(/"/g, '""')}"`;
      return `${item.id},${timestamp},${empresa},${item.empresa_cnpj || 'N/A'},${item.chave_acesso || 'N/A'},${item.valor_total || 0},${qrContent}`;
    }).join('\n');

    const fullContent = headers + csvContent;
    downloadFile(fullContent, 'cupons-fiscais.csv', 'text/csv');
    toast.success(`${dataToExport.length} cupons exportados para CSV!`);
  };

  const exportFullBackup = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      toast.info('Preparando backup completo...');
      
      // Buscar todos os cupons do usuário
      const { data: cuponsData, error: cuponsError } = await supabase
        .from('cupom_fiscal')
        .select('*')
        .eq('user_id', user.id);

      if (cuponsError) throw cuponsError;

      // Buscar todos os itens relacionados aos cupons
      const cupomIds = cuponsData?.map(c => c.id) || [];
      let itensData: any[] = [];
      
      if (cupomIds.length > 0) {
        const { data: items, error: itensError } = await supabase
          .from('itens_compra')
          .select('*')
          .in('cupom_id', cupomIds);

        if (itensError) throw itensError;
        itensData = items || [];
      }

      // Buscar configurações do usuário
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id);

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      // Criar backup completo
      const backupData = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        user_email: user.email,
        cupons_fiscais: cuponsData,
        itens_compra: itensData,
        user_settings: settingsData || [],
        total_cupons: cuponsData?.length || 0,
        total_itens: itensData.length
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      const fileName = `backup-completo-${new Date().toISOString().split('T')[0]}.json`;
      
      downloadFile(backupJson, fileName, 'application/json');
      toast.success(`Backup completo exportado! ${backupData.total_cupons} cupons e ${backupData.total_itens} itens.`);
      
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast.error('Erro ao criar backup completo');
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getTypeColor = (item: CupomFiscal) => {
    if (item.chave_acesso) {
      return 'bg-green-100 text-green-800';
    } else if (item.qr_content?.startsWith('http')) {
      return 'bg-blue-100 text-blue-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (item: CupomFiscal) => {
    if (item.chave_acesso) {
      return 'NFC-e';
    } else if (item.qr_content?.startsWith('http')) {
      return 'URL';
    } else {
      return 'QR Code';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-6 h-6 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Exportar Dados
              </span>
            </div>
            {cupons.length > 0 && (
              <Button 
                onClick={selectAll}
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                {selectedItems.size === cupons.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cupons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Download className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Nenhum dado para exportar</p>
              <p className="text-sm">Escaneie alguns QR codes primeiro</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4 justify-center">
                <Button 
                  onClick={exportToTxt}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-full transition-all duration-200 transform hover:scale-105"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Exportar TXT ({selectedItems.size || cupons.length} itens)
                </Button>
                <Button 
                  onClick={exportToCsv}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-full transition-all duration-200 transform hover:scale-105"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Exportar CSV ({selectedItems.size || cupons.length} itens)
                </Button>
                <Button 
                  onClick={exportFullBackup}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full transition-all duration-200 transform hover:scale-105"
                >
                  <Database className="w-5 h-5 mr-2" />
                  Backup Completo BD
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Selecione os itens para exportar:
                </h3>
                {cupons.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white/60"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(item.id!)}
                        onCheckedChange={() => toggleSelection(item.id!)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item)}`}>
                            {getTypeLabel(item)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.created_at && formatDate(item.created_at)}
                          </span>
                        </div>
                        
                        {item.empresa_nome && (
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {item.empresa_nome}
                          </p>
                        )}
                        
                        {item.valor_total && (
                          <p className="text-sm text-gray-600 mb-1">
                            Valor: R$ {item.valor_total.toFixed(2)}
                          </p>
                        )}
                        
                        <p className="text-gray-800 break-all font-mono text-xs bg-gray-50 p-2 rounded truncate">
                          {item.qr_content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportData;
