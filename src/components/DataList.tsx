
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useCupomFiscal, CupomFiscal } from '@/hooks/useCupomFiscal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DataListProps {
  onDataChanged: () => void;
}

const DataList: React.FC<DataListProps> = ({ onDataChanged }) => {
  const { cupons, loading, deleteCupom, updateCupom } = useCupomFiscal();
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [editingItem, setEditingItem] = useState<CupomFiscal | null>(null);
  const [editContent, setEditContent] = useState('');
  const [viewingItem, setViewingItem] = useState<CupomFiscal | null>(null);
  const [itemsDetalhes, setItemsDetalhes] = useState<any[]>([]);
  const { user } = useAuth();

  const deleteSelected = async () => {
    for (const id of selectedItems) {
      await deleteCupom(id);
    }
    setSelectedItems(new Set());
    onDataChanged();
  };

  const editItem = (item: CupomFiscal) => {
    setEditingItem(item);
    setEditContent(item.qr_content);
  };

  const saveEdit = async () => {
    if (editingItem && editingItem.id) {
      await updateCupom(editingItem.id, { qr_content: editContent });
      setEditingItem(null);
      setEditContent('');
      onDataChanged();
    }
  };

  const viewItemDetails = async (item: CupomFiscal) => {
    setViewingItem(item);
    
    if (item.id) {
      try {
        const { data: itens, error } = await supabase
          .from('itens_compra')
          .select('*')
          .eq('cupom_id', item.id);

        if (error) throw error;
        setItemsDetalhes(itens || []);
      } catch (error) {
        console.error('Erro ao carregar itens:', error);
        setItemsDetalhes([]);
      }
    }
  };

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
              <FileText className="w-6 h-6 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dados Salvos ({cupons.length})
              </span>
            </div>
            {cupons.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  onClick={selectAll}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  {selectedItems.size === cupons.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
                {selectedItems.size > 0 && (
                  <Button 
                    onClick={deleteSelected}
                    variant="destructive"
                    size="sm"
                  >
                    Excluir Selecionados ({selectedItems.size})
                  </Button>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cupons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Nenhum QR code escaneado ainda</p>
              <p className="text-sm">Use o scanner para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cupons.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 bg-white/60"
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
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewItemDetails(item)}
                        className="border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => editItem(item)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Conteúdo</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              placeholder="Digite o novo conteúdo"
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setEditingItem(null)}>
                                Cancelar
                              </Button>
                              <Button onClick={saveEdit}>
                                Salvar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => item.id && deleteCupom(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para visualizar detalhes */}
      <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Cupom Fiscal</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Empresa</label>
                  <p className="text-sm">{viewingItem.empresa_nome || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">CNPJ</label>
                  <p className="text-sm">{viewingItem.empresa_cnpj || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data</label>
                  <p className="text-sm">{viewingItem.data_emissao || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor Total</label>
                  <p className="text-sm">R$ {viewingItem.valor_total?.toFixed(2) || '0,00'}</p>
                </div>
              </div>
              
              {itemsDetalhes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Itens da Compra:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {itemsDetalhes.map((item, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium">{item.nome_item}</p>
                        <p>Qtd: {item.quantidade} {item.unidade} - R$ {item.valor_total?.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataList;
