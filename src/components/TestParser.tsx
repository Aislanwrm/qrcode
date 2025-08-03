
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseNFCeURL } from '@/utils/nfceParser';
import { useCupomFiscal } from '@/hooks/useCupomFiscal';
import { toast } from 'sonner';
import { TestTube, Code } from 'lucide-react';

const TestParser = () => {
  const [testUrl, setTestUrl] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const { saveCupom } = useCupomFiscal();

  const testExtraction = async () => {
    if (!testUrl.trim()) {
      toast.error('Por favor, insira uma URL de teste');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Iniciando teste de extração com URL:', testUrl);
      const data = await parseNFCeURL(testUrl);
      // Campos essenciais para que todos os tenham sido extraídos
      const camposEssenciais = [
        'empresa_nome',
        'empresa_cnpj',
        'logradouro',
        'cidade',
        'cep',
        'quantidade_itens',
        'valor_total',
      ];
      // Verifica se todos os campos essenciais não estão vazios
      const todosPresentes = camposEssenciais.every(
        (campo) => data[campo] && String(data[campo]).trim() !== ''
      );
      if (todosPresentes) {
        toast.success('Dados extraídos com sucesso! Verifique o console para detalhes.');
      } else {
        toast.warning('Dados parcialmente extraídos. Verifique o console para detalhes.');
      }
      setExtractedData(data);

    } catch (error) {
      console.error('Erro no teste:', error);
      toast.error('Erro ao extrair dados: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTestData = async () => {
    if (!extractedData) {
      toast.error('Nenhum dado para salvar');
      return;
    }

    const success = await saveCupom(extractedData);
    if (success) {
      toast.success('Dados de teste salvos no banco de dados!');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Teste de Extração de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Cole aqui a URL do QR code para testar"
            className="flex-1"
          />
          <Button onClick={testExtraction} disabled={isLoading}>
            {isLoading ? 'Extraindo...' : 'Testar'}
          </Button>
        </div>

        {extractedData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span className="font-semibold">Dados Extraídos:</span>
              <Button onClick={saveTestData} size="sm" variant="outline">
                Salvar no BD
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-sm">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            </div>

            {extractedData.itens && extractedData.itens.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Itens Extraídos ({extractedData.itens.length}):</h4>
                <div className="space-y-2">
                  {extractedData.itens.map((item: any, index: number) => (
                    <div key={index} className="bg-blue-50 p-2 rounded text-sm">
                      <div><strong>Código:</strong> {item.codigo_item}</div>
                      <div><strong>Nome:</strong> {item.nome_item}</div>
                      <div><strong>Quantidade:</strong> {item.quantidade} {item.unidade}</div>
                      <div><strong>Valor:</strong> R$ {item.valor_total?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestParser;
