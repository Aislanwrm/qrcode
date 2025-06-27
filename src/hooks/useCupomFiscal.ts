import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CupomFiscal {
  id?: number;
  user_id?: string;
  chave_acesso?: string;
  empresa_nome?: string;
  empresa_cnpj?: string;
  empresa_ie?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  consumidor_nome?: string;
  consumidor_cpf?: string;
  consumidor_uf?: string;
  destino_operacao?: number;
  consumidor_final?: number;
  presenca_comprador?: number;
  modelo?: string;
  serie?: string;
  numero_cupom?: string;
  data_emissao?: string;
  hora_emissao?: string;
  quantidade_itens?: number;
  valor_total?: number;
  valor_pago?: number;
  forma_pagamento?: string;
  base_calculo_icms?: number;
  valor_icms?: number;
  protocolo?: string;
  qr_content: string;
  created_at?: string;
  updated_at?: string;
}

export interface ItemCompra {
  id?: number;
  cupom_id?: number;
  nome_item?: string;
  codigo_item?: string;
  quantidade?: number;
  unidade?: string;
  valor_total?: number;
  created_at?: string;
}

export const useCupomFiscal = () => {
  const [cupons, setCupons] = useState<CupomFiscal[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadCupons = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cupom_fiscal')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCupons(data || []);
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      toast.error('Erro ao carregar cupons fiscais');
    } finally {
      setLoading(false);
    }
  };

  const saveCupom = async (cupomData: CupomFiscal, itens?: ItemCompra[]): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('Verificando duplicatas para:', cupomData.qr_content?.substring(0, 50) + '...');
      
      // Verificar duplicatas usando uma abordagem mais robusta
      // Primeiro, buscar pela chave de acesso se disponível
      let existingCupom = null;
      
      if (cupomData.chave_acesso && cupomData.chave_acesso.length === 44) {
        console.log('Verificando por chave de acesso:', cupomData.chave_acesso);
        const { data: cupomByChave } = await supabase
          .from('cupom_fiscal')
          .select('id')
          .eq('user_id', user.id)
          .eq('chave_acesso', cupomData.chave_acesso)
          .maybeSingle();
        
        existingCupom = cupomByChave;
      }
      
      // Se não encontrou pela chave, buscar pelo hash do QR content para evitar URLs muito longas
      if (!existingCupom && cupomData.qr_content) {
        console.log('Verificando por QR content (primeiros 100 caracteres)');
        const qrStart = cupomData.qr_content.substring(0, 100);
        
        const { data: allUserCupons } = await supabase
          .from('cupom_fiscal')
          .select('id, qr_content')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50); // Limitar para evitar busca muito pesada
        
        if (allUserCupons) {
          existingCupom = allUserCupons.find(cupom => 
            cupom.qr_content === cupomData.qr_content
          );
        }
      }

      if (existingCupom) {
        console.log('Cupom duplicado encontrado');
        toast.error('Este QR code já foi escaneado anteriormente');
        return false;
      }

      console.log('Nenhuma duplicata encontrada, salvando cupom...');

      // Extrair itens do cupomData se existirem
      const itemsToSave = itens || (cupomData as any).itens || [];

      // Preparar dados do cupom (remover itens se existirem no objeto)
      const { itens: _, ...cleanCupomData } = cupomData as any;

      console.log('Dados limpos para salvar:', cleanCupomData);

      // Inserir cupom fiscal
      const { data: newCupom, error: cupomError } = await supabase
        .from('cupom_fiscal')
        .insert([{ ...cleanCupomData, user_id: user.id }])
        .select()
        .single();

      if (cupomError) {
        console.error('Erro ao inserir cupom:', cupomError);
        throw cupomError;
      }

      console.log('Cupom salvo com sucesso:', newCupom);

      // Inserir itens se fornecidos
      if (itemsToSave && itemsToSave.length > 0 && newCupom) {
        console.log('Salvando', itemsToSave.length, 'itens...');
        const itensWithCupomId = itemsToSave.map((item: any) => ({
          ...item,
          cupom_id: newCupom.id
        }));

        const { error: itensError } = await supabase
          .from('itens_compra')
          .insert(itensWithCupomId);

        if (itensError) {
          console.error('Erro ao inserir itens:', itensError);
          throw itensError;
        }
        console.log('Itens salvos com sucesso');
      }

      const itemCount = itemsToSave.length;
      toast.success(`Cupom fiscal salvo com sucesso! ${itemCount > 0 ? `${itemCount} itens incluídos.` : ''}`);
      await loadCupons();
      return true;
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      toast.error('Erro ao salvar cupom fiscal: ' + (error as Error).message);
      return false;
    }
  };

  const deleteCupom = async (id: number) => {
    try {
      const { error } = await supabase
        .from('cupom_fiscal')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Cupom excluído com sucesso!');
      await loadCupons();
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      toast.error('Erro ao excluir cupom');
    }
  };

  const updateCupom = async (id: number, updates: Partial<CupomFiscal>) => {
    try {
      const { error } = await supabase
        .from('cupom_fiscal')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Cupom atualizado com sucesso!');
      await loadCupons();
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      toast.error('Erro ao atualizar cupom');
    }
  };

  const searchCupons = async (searchTerm: string, filters?: {
    startDate?: string;
    endDate?: string;
    minValue?: number;
    maxValue?: number;
  }) => {
    if (!user) return [];
    
    try {
      let query = supabase
        .from('cupom_fiscal')
        .select('*')
        .eq('user_id', user.id);

      // Filtros de busca por texto
      if (searchTerm) {
        query = query.or(`empresa_nome.ilike.%${searchTerm}%,empresa_cnpj.ilike.%${searchTerm}%,chave_acesso.ilike.%${searchTerm}%,qr_content.ilike.%${searchTerm}%`);
      }

      // Filtros de data
      if (filters?.startDate) {
        query = query.gte('data_emissao', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('data_emissao', filters.endDate);
      }

      // Filtros de valor
      if (filters?.minValue) {
        query = query.gte('valor_total', filters.minValue);
      }
      if (filters?.maxValue) {
        query = query.lte('valor_total', filters.maxValue);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
      toast.error('Erro ao buscar cupons');
      return [];
    }
  };

  const getAllItens = async (cupomId?: number) => {
    if (!user) return [];
    
    try {
      let query = supabase
        .from('itens_compra')
        .select(`
          *,
          cupom_fiscal (
            empresa_nome,
            data_emissao,
            chave_acesso
          )
        `);

      if (cupomId) {
        query = query.eq('cupom_id', cupomId);
      } else {
        // Buscar todos os itens dos cupons do usuário
        const { data: userCupons } = await supabase
          .from('cupom_fiscal')
          .select('id')
          .eq('user_id', user.id);

        if (userCupons && userCupons.length > 0) {
          const cupomIds = userCupons.map(c => c.id);
          query = query.in('cupom_id', cupomIds);
        } else {
          return [];
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      toast.error('Erro ao carregar itens');
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      loadCupons();
    }
  }, [user]);

  return {
    cupons,
    loading,
    saveCupom,
    deleteCupom,
    updateCupom,
    loadCupons,
    searchCupons,
    getAllItens
  };
};