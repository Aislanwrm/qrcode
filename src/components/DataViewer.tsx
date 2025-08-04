import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCupomFiscal, CupomFiscal, ItemCompra } from '@/hooks/useCupomFiscal';
import { Search, Filter, Eye, ShoppingCart, Calendar, DollarSign, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { formatCNPJ, formatCPF, formatCEP, formatCupom } from '@/utils/formatters';


const DataViewer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [valueFilter, setValueFilter] = useState({ min: '', max: '' });
  const [selectedCupom, setSelectedCupom] = useState<CupomFiscal | null>(null);
  const [cupons, setCupons] = useState<CupomFiscal[]>([]);
  const [allItens, setAllItens] = useState<ItemCompra[]>([]);
  const [filteredCupons, setFilteredCupons] = useState<CupomFiscal[]>([]);
  const [filteredItens, setFilteredItens] = useState<ItemCompra[]>([]);
  const [viewMode, setViewMode] = useState<'cupons' | 'itens'>('cupons');
  const [loading, setLoading] = useState(false);

  const { searchCupons, getAllItens } = useCupomFiscal();

  // Função para formatar data de yyyy-mm-dd para dd/mm/yyyy
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    if (dateString.includes('/')) return dateString; // Já está no formato brasileiro
    
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Função para converter data de dd/mm/yyyy para yyyy-mm-dd para comparação
  const convertDateForComparison = (dateString: string) => {
    if (!dateString) return '';
    if (dateString.includes('-')) return dateString; // Já está no formato ISO
    
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Função para calcular soma dos valores
  const calculateTotal = () => {
    if (selectedCupom) {
      return filteredItens.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    } else if (viewMode === 'cupons') {
      return filteredCupons.reduce((sum, cupom) => sum + (cupom.valor_total || 0), 0);
    } else {
      return filteredItens.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, dateFilter, valueFilter, cupons, allItens, viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cuponsData, itensData] = await Promise.all([
        searchCupons(''),
        getAllItens()
      ]);
      setCupons(cuponsData);
      setAllItens(itensData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    if (viewMode === 'cupons') {
      const filters = {
        startDate: dateFilter.start || undefined,
        endDate: dateFilter.end || undefined,
        minValue: valueFilter.min ? parseFloat(valueFilter.min) : undefined,
        maxValue: valueFilter.max ? parseFloat(valueFilter.max) : undefined,
      };
      
      const filtered = await searchCupons(searchTerm, filters);
      setFilteredCupons(filtered);
    } else {
      let filtered = allItens;
      
      // Filtro por nome do item, código ou empresa
      if (searchTerm) {
        filtered = filtered.filter(item => 
          item.nome_item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.codigo_item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item as any).cupom_fiscal?.empresa_nome?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filtro por data (baseado na data de emissão do cupom)
      if (dateFilter.start) {
        filtered = filtered.filter(item => {
          const cupomData = (item as any).cupom_fiscal?.data_emissao;
          if (!cupomData) return false;
          
          // Converter data para formato de comparação (yyyy-mm-dd)
          const dataComparacao = convertDateForComparison(cupomData);
          return dataComparacao >= dateFilter.start;
        });
      }
      
      if (dateFilter.end) {
        filtered = filtered.filter(item => {
          const cupomData = (item as any).cupom_fiscal?.data_emissao;
          if (!cupomData) return false;
          
          // Converter data para formato de comparação (yyyy-mm-dd)
          const dataComparacao = convertDateForComparison(cupomData);
          return dataComparacao <= dateFilter.end;
        });
      }
      
      // Filtros de valor
      if (valueFilter.min) {
        const minValue = parseFloat(valueFilter.min);
        filtered = filtered.filter(item => (item.valor_total || 0) >= minValue);
      }
      
      if (valueFilter.max) {
        const maxValue = parseFloat(valueFilter.max);
        filtered = filtered.filter(item => (item.valor_total || 0) <= maxValue);
      }
      
      setFilteredItens(filtered);
    }
  };

  const viewCupomDetails = async (cupom: CupomFiscal) => {
    cupom = formatCupom(cupom);
    setSelectedCupom(cupom);
    if (cupom.id) {
      const itens = await getAllItens(cupom.id);
      setFilteredItens(itens);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Visualizar Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de modo de visualização */}
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'cupons' ? 'default' : 'outline'}
              onClick={() => {
                setViewMode('cupons');
                setSelectedCupom(null);
              }}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Cupons
            </Button>
            <Button 
              variant={viewMode === 'itens' ? 'default' : 'outline'}
              onClick={() => {
                setViewMode('itens');
                setSelectedCupom(null);
              }}
              className="flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Todos os Itens
            </Button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Pesquisar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder={viewMode === 'cupons' ? 'Empresa, CNPJ, chave...' : 'Empresa, Nome do item, código...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Data Inicial</label>
              <Input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Data Final</label>
              <Input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Valor Mínimo</label>
              <Input
                type="number"
                placeholder="0,00"
                value={valueFilter.min}
                onChange={(e) => setValueFilter(prev => ({ ...prev, min: e.target.value }))}
              />
            </div>

            {!selectedCupom && (
              <div>
                <label className="text-sm font-medium mb-1 block">Valor Máximo</label>
                <Input
                  type="number"
                  placeholder="999,99"
                  value={valueFilter.max}
                  onChange={(e) => setValueFilter(prev => ({ ...prev, max: e.target.value }))}
                />
              </div>
            )}
          </div>

          <Button 
            onClick={() => {
              setSearchTerm('');
              setDateFilter({ start: '', end: '' });
              setValueFilter({ min: '', max: '' });
            }}
            variant="outline"
            size="sm"
          >
            Limpar Filtros
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Carregando dados...
          </CardContent>
        </Card>
      ) : (
        <>
          {selectedCupom ? (
            /* Visualização de cupom específico */
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="mb-2">Detalhes do Cupom</CardTitle>
                    <p className="text-sm text-gray-600">{selectedCupom.empresa_nome}</p>
                  </div>
                  <Button onClick={() => setSelectedCupom(null)} variant="outline" size="sm">
                    Voltar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2">Informações da Empresa</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>CNPJ:</strong> {selectedCupom.empresa_cnpj || ''}</p>
                      <p><strong>IE:</strong> {selectedCupom.empresa_ie || ''}</p>
                      <p><strong>Endereço:</strong> {[selectedCupom.logradouro, selectedCupom.numero, selectedCupom.complemento].filter(Boolean).join(', ')}</p>
                      <p><strong>Bairro:</strong> {selectedCupom.bairro || ''}</p>
                      <p><strong>Cidade-UF:</strong> {[selectedCupom.cidade, selectedCupom.uf].filter(Boolean).join('-')}</p>
                      <p><strong>CEP:</strong> {selectedCupom.cep || ''}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Informações do Consumidor</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Nome:</strong> {selectedCupom.consumidor_nome || ''}</p>
                      <p><strong>CPF:</strong> {selectedCupom.consumidor_cpf || ''}</p>
                      <p><strong>UF:</strong> {selectedCupom.consumidor_uf || ''}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Informações do Cupom</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Data:</strong> {formatDate(selectedCupom.data_emissao || '')}</p>
                      <p><strong>Hora:</strong> {selectedCupom.hora_emissao || ''}</p>
                      <p><strong>Valor Total:</strong> R$ {selectedCupom.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                      <p><strong>Valor Pago:</strong> R$ {selectedCupom.valor_pago?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                      <p><strong>Desconto:</strong> R$ {(selectedCupom.valor_total-selectedCupom.valor_pago)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                      <p><strong>Forma Pagamento:</strong> {selectedCupom.forma_pagamento || ''}</p>
                      <p><strong>Protocolo:</strong> {selectedCupom.protocolo || ''}</p>
                      <p><strong>Chave de Acesso:</strong> {selectedCupom.chave_acesso || ''}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Itens do Cupom ({filteredItens.length})</h3>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calculator className="w-4 h-4" />
                    Total: R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {filteredItens.length > 0 ? (
                  <div className="space-y-2">
                    <div className="hidden lg:grid sticky top-0 z-10 grid-cols-5 gap-1 text-sm bg-gray-100 border rounded-lg p-4">
                      <div><strong>Código</strong></div>
                      <div><strong>Item</strong></div>
                      <div><strong>Quantidade</strong></div>
                      <div><strong>Preço unitário</strong></div>
                      <div><strong>Valor total</strong></div>
                    </div>
                    {filteredItens.map((item, index) => (
                      <React.Fragment key={item.id || index}>

                        {/* ✅ VERSÃO MOBILE */}
                        <div className="block lg:hidden border rounded-lg p-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <strong>Código:</strong> {item.codigo_item || ''}
                            </div>
                            <div>
                              <strong>Item:</strong> {item.nome_item || ''}
                            </div>
                            <div>
                              <strong>Quantidade:</strong> {item.quantidade || 0} {item.unidade.toLowerCase() || ''}
                            </div>
                            <div>
                              <strong>Preço unitário:</strong> R$ {((item.valor_total/item.quantidade) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div>
                              <strong>Valor total:</strong> R$ {(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        {/* 💻 VERSÃO DESKTOP */}
                        <div className="hidden lg:grid border rounded-lg p-4">
                          <div className="grid grid-cols-5 gap-2 text-sm">
                            <div>
                              {item.codigo_item || ''}
                            </div>
                            <div>
                              {item.nome_item || ''}
                            </div>
                            <div>
                              {item.quantidade || 0} {item.unidade.toLowerCase() || ''}
                            </div>
                            <div>
                              R$ {(item.valor_total / item.quantidade || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div>
                              R$ {(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum item encontrado para este cupom.</p>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'cupons' ? (
            /* Lista de cupons */
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Cupons Fiscais ({filteredCupons.length})</CardTitle>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calculator className="w-4 h-4" />
                    Total: R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCupons.length > 0 ? (
                  <div className="space-y-3">
                    {filteredCupons.map((cupom) => (
                      <div key={cupom.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{cupom.empresa_nome}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(cupom.data_emissao || '') || 'Data não informada'}
                              </div>
                              <div className="flex items-center gap-1">
                                R$ {cupom.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                              </div>
                              <div>
                                <Badge variant="outline">
                                  {cupom.quantidade_itens || 0} itens
                                </Badge>
                              </div>
                            </div>
                            {cupom.empresa_cnpj && (
                              <p className="text-xs text-gray-500 mt-1">CNPJ: {formatCNPJ(cupom.empresa_cnpj)}</p>
                            )}
                          </div>
                          <Button 
                            onClick={() => viewCupomDetails(cupom)}
                            size="sm"
                            variant="outline"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Nenhum cupom encontrado com os filtros aplicados.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Lista de todos os itens com filtros aplicados */
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Todos os Itens ({filteredItens.length})</CardTitle>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calculator className="w-4 h-4" />
                    Total: R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredItens.length > 0 ? (
                  <div className="space-y-3">

                    <div className="hidden lg:grid sticky top-0 z-10 grid-cols-8 gap-1 text-sm bg-gray-100 border rounded-lg p-4">
                      <div><strong>Código</strong></div>
                      <div><strong>Item</strong></div>
                      <div><strong>Quantidade</strong></div>
                      <div><strong>Preço unitário</strong></div>
                      <div><strong>Valor total</strong></div>
                      <div><strong>Empresa</strong></div>
                      <div><strong>Data</strong></div>
                      <div><strong>Item #</strong></div>
                    </div>                    

                    {filteredItens.map((item, index) => (
                      <React.Fragment key={item.id || index}>
                        
                        {/* ✅ VERSÃO MOBILE */}
                        <div className="block lg:hidden border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="font-semibold">{item.nome_item || 'Item sem nome'}</p>
                              <p className="text-sm text-gray-600">Código: {item.codigo_item || 'N/A'}</p>
                            </div>
                            <div className="text-sm">
                              <p><strong>Quantidade:</strong> {item.quantidade || 0} {item.unidade.toLowerCase() || ''}</p>
                              <p><strong>Preço unitário:</strong> R$ {(item.valor_total/item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              <p><strong>Valor total:</strong> R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-sm">
                              {(item as any).cupom_fiscal && (
                                <>
                                  <p><strong>Empresa:</strong> {(item as any).cupom_fiscal.empresa_nome}</p>
                                  <p><strong>Data:</strong> {formatDate((item as any).cupom_fiscal.data_emissao)}</p>
                                </>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">
                                Item #{item.id}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* 💻 VERSÃO DESKTOP */}
                        <div className="hidden lg:grid border rounded-lg p-4">
                          <div className="text-sm grid grid-cols-8 gap-1">
                            <div>
                              <p className="text-gray-600">{item.codigo_item || 'N/A'}</p>
                            </div>
                            <div>
                              <p>{item.nome_item || 'Item sem nome'}</p>
                            </div>
                            <div>
                              <p>{item.quantidade || 0} {item.unidade.toLowerCase() || ''}</p>
                            </div>
                            <div>
                              <p>R$ {(item.valor_total/item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                              <p>R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                              {(item as any).cupom_fiscal && (
                                <>
                                  <p>{(item as any).cupom_fiscal.empresa_nome}</p>
                                </>
                              )}
                            </div>
                            <div>
                              {(item as any).cupom_fiscal && (
                                <>
                                  <p>{formatDate((item as any).cupom_fiscal.data_emissao)}</p>
                                </>
                              )}
                            </div>
                            <div>
                              <Badge variant="secondary">
                                #{item.id}
                              </Badge>
                            </div>
                          </div>
                        </div>

                      </React.Fragment>
                  ))}

                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Nenhum item encontrado com os filtros aplicados.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default DataViewer;