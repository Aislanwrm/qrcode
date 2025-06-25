// Helper para formatar preços com vírgula
const formatPrice = (value: number): string => {
  return value.toFixed(2).replace('.', ',');
};

export const parseNFCeURL = async (qrContent: string) => {
  try {
    console.log('Processando QR content:', qrContent);

    // Extrair a chave de acesso do QR code (usando regex para localizar o padrão conhecido)
    const chaveMatch = qrContent.match(/chNFe=([A-F0-9]{44})/i);
    let chaveAcesso = '';
    if (chaveMatch) {
      chaveAcesso = chaveMatch[1];
      console.log('Chave de acesso extraída:', chaveAcesso);
    } else {
      // Tenta extrair no formato alternativo (separado por |)
      const possibleChave = qrContent.split('|')[0].match(/([A-F0-9]{44})/);
      if (possibleChave) {
        chaveAcesso = possibleChave[1];
        console.log('Chave encontrada no formato alternativo:', chaveAcesso);
      } else {
        throw new Error('Chave de acesso não encontrada no QR code');
      }
    }

    // Extrair outras informações básicas do QR code (como valor total)
    const urlParts = qrContent.split('|');
    let valorTotal = 0;
    if (urlParts.length >= 4) {
      valorTotal = parseFloat(urlParts[3]) || 0;
      console.log('Valor total do QR:', valorTotal);
    }

    // Dados básicos iniciais (serão complementados com dados extraídos do HTML)
    let nfceData: any = {
      chave_acesso: chaveAcesso,
      valor_total: valorTotal,
      qr_content: qrContent,
      empresa_nome: '',
      empresa_cnpj: '',
      empresa_ie: '',
      logradouro: '',
      numero: '',
      bairro: '',
      complemento: '',
      cidade: '',
      uf: '',
      cep: '',
      data_emissao: new Date().toISOString().split('T')[0],
      hora_emissao: new Date().toTimeString().split(' ')[0],
      quantidade_itens: 0,
      valor_pago: 0,
      forma_pagamento: '',
      consumidor_nome: '',
      consumidor_cpf: '',
      consumidor_uf: '',
      destino_operacao: '', // Esperado formato numérico (1 ou 0)
      consumidor_final: '',
      presenca_comprador: '',
      modelo: '',
      serie: '',
      numero_cupom: '',
      base_calculo_icms: 0,
      valor_icms: 0,
      protocolo: ''
    };

    // Tenta acessar o link da NFC-e para extrair os dados do HTML
    try {
      const linkMatch = qrContent.match(/(https?:\/\/[^\s|]+)/);
      if (linkMatch) {
        const nfceUrl = qrContent; // Podemos usar linkMatch[1] se necessário
        console.log('Tentando acessar URL da NFC-e:', nfceUrl);

        // Tentar múltiplos proxies para contornar restrições CORS
        const proxies = [
          `https://api.allorigins.win/get?url=${nfceUrl}`/*,
          `https://api.codetabs.com/v1/proxy?quest=${nfceUrl}`,
          `https://cors.bridged.cc/${nfceUrl}`,
          `https://corsproxy.io/?${nfceUrl}`,
          `https://cors-anywhere.herokuapp.com/${nfceUrl}`*/
        ];

        let htmlContent = '';
        for (const proxyUrl of proxies) {
          try {
            console.log('Tentando proxy:', proxyUrl);
            const response = await fetch(proxyUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
              }
            });
            if (response.ok) {
              const data = await response.json();
              htmlContent = data.contents || data.content || data;
              console.log('HTML obtido via proxy.');
              break;
            }
          } catch (proxyError) {
            console.log('Erro com proxy:', proxyError);
            continue;
          }
        }

        // Se os proxies não obtiverem resposta, tenta acesso direto
        if (!htmlContent) {
          try {
            console.log('Tentando acesso direto à URL...');
            const directResponse = await fetch(nfceUrl, { method: 'GET' });
            htmlContent = await directResponse.text();
            console.log('HTML obtido com acesso direto.');
          } catch (directError) {
            console.log('Acesso direto falhou:', directError);
          }
        }

        if (htmlContent) {
          // Extrai dados do HTML utilizando seletores DOM
          const extractedData = extractDataFromHTML(htmlContent);
          if (extractedData) {
            nfceData = { ...nfceData, ...extractedData };
            console.log('Dados extraídos do HTML:', extractedData);
          }
        } else {
          console.warn('Não foi possível obter o HTML da NFC-e');
        }
      }
    } catch (error) {
      console.warn('Erro ao acessar o HTML da NFC-e:', error);
      nfceData.empresa_nome = 'Dados básicos do QR Code';
    }

    // Formatação dos preços: utiliza vírgula como separador decimal
    /*nfceData.valor_total = parseInt(nfceData.valor_total);
    nfceData.valor_pago = parseFloat(nfceData.valor_pago);
    if (nfceData.base_calculo_icms) {
      nfceData.base_calculo_icms = parseFloat(nfceData.base_calculo_icms);
    }
    if (nfceData.valor_icms) {
      nfceData.valor_icms = parseFloat(nfceData.valor_icms);
    }
    if (nfceData.valor_total_servico) {
      nfceData.valor_total_servico = parseFloat(nfceData.valor_total_servico);
    }*/

    console.log('Dados finais extraídos:', nfceData);
    return nfceData;

  } catch (error) {
    console.error('Erro ao processar QR code NFC-e:', error);
    throw error;
  }
};

const extractDataFromHTML = (html: string) => {
  try {
    console.log('Iniciando extração de dados do HTML...');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const extractedData: any = {};

    // 1. Extrair endereço (primeira tabela com classe "table text-center")
    const addressCell = doc.querySelector("table.table.text-center td[style*='display: block']");
    if (addressCell) {
      const enderecoCompleto = addressCell.textContent.trim();
      // Divide o endereço por vírgulas
      const partes = enderecoCompleto.split(',');
      if (partes.length >= 2) {
        extractedData.logradouro = partes[0].trim();
        extractedData.bairro = partes[2].trim();
        extractedData.uf = partes[4].trim();

        // Extrai o número e possível complemento da segunda parte
        const numeroEComplemento = partes[1].trim();
        // Captura a sequência numérica e o restante (possível complemento)
        const match = numeroEComplemento.match(/^(\d+)\s*(.*)$/);
        if (match) {
          // Remove zeros à esquerda do número
          extractedData.numero = match[1].replace(/^0+/, '');
          const complementoCandidate = match[2].trim();
          // Se existir complemento e o primeiro caractere não for uma letra, atribui-o
          if (complementoCandidate && /^[A-Za-z]/.test(complementoCandidate)) {
            extractedData.complemento = complementoCandidate;
          }
        } else {
          extractedData.numero = numeroEComplemento.replace(/^0+/, '');
        }

        // Extrai bairro, CEP, cidade e uf se disponíveis
        if (partes.length >= 3) {
          const CEPCidade = partes[3].split('-');
          if (CEPCidade.length >= 2) {
            if (CEPCidade && CEPCidade.length === 2) {
              extractedData.cep = CEPCidade[0].trim();
              extractedData.cidade = CEPCidade[1].trim();
            }
          }
        }
      }
    }
        // 2. Extrair itens (da tabela com id "myTable")
    const itensTableBody = doc.querySelector("#myTable");
    if (itensTableBody) {
      const itens: any[] = [];
      const rows = itensTableBody.querySelectorAll("tr");
      rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 4) {
          // O primeiro TD contém o nome e o código (entre parênteses)
          const nomeCodigoText = cells[0].textContent.trim();
          let nome_item = '';
          let codigo_item = '';
          const codigoMatch = nomeCodigoText.match(/\(Código:\s*([^)]+)\)/i);
          if (codigoMatch) {
            codigo_item = codigoMatch[1].trim();
            nome_item = nomeCodigoText.replace(codigoMatch[0], '').trim();
          } else {
            nome_item = nomeCodigoText;
          }
          // Os demais TDs contêm quantidade, unidade e valor
          const qtdeText = cells[1]?.textContent.split('Qtde total de ítens:')[1].trim() || '0';
          const unidadeText = cells[2]?.textContent.replace(/UN:\s*/i, '').trim() || '';
          const valorText = cells[3]?.textContent.split('Valor total R$: R$')[1].trim() || '0';
          const item = {
            codigo_item,
            nome_item,
            quantidade: parseFloat(qtdeText.replace(',', '.')) || 0,
            unidade: unidadeText,
            // Converter valor para float; a formatação final será aplicada posteriormente
            valor_total: parseFloat(valorText.replace(',', '.'))
          };
          itens.push(item);
          console.log('Item extraído:', item);
        }
      });
      if (itens.length > 0) {
        extractedData.itens = itens;
        extractedData.quantidade_itens = itens.length;
      }
    }

    // 3. Extrair totais e forma de pagamento a partir dos blocos com div.row
    const rowsDiv = doc.querySelectorAll("div.row");
    rowsDiv.forEach(row => {
      const strongs = row.querySelectorAll("strong");
      if (strongs.length === 2) {
        const label = strongs[0].textContent.trim().toLowerCase();
        const value = strongs[1].textContent.trim();
        if (label.includes("valor total r$")) {
          extractedData.valor_total = parseFloat(value.replace(',', '.'));
        } else if (label.includes("valor pago r$")) {
          extractedData.valor_pago = parseFloat(value.replace(',', '.'));
        } else if (label.includes("forma de pagamento")) {
          const valor = value.split(' - ')[0]; // Remove a descrição da Forma de pagamento"
          extractedData.forma_pagamento = valor.trim();
        }
      }
    });

    // 4. Extrair dados do painel accordion
    const accordion = doc.getElementById("accordion");
    if (accordion) {

      // a) Dados consumidor
      const infoconsumidorPanel = Array.from(accordion.querySelectorAll(".panel"))
        .find(panel => panel.textContent.toLowerCase().includes("consumidor"));
      if (infoconsumidorPanel) {
        const collapseDiv = infoconsumidorPanel.querySelector("div.collapse");
        if (collapseDiv) {
          const consumidorTable = collapseDiv.querySelector("table.table-hover");
          if (consumidorTable) {
            const consumidorRow = consumidorTable.querySelector("tbody tr");
            if (consumidorRow) {
              const cells = consumidorRow.querySelectorAll("td");
              if (cells.length >= 3) {
                extractedData.consumidor_nome = cells[0].textContent.trim();
                extractedData.consumidor_cpf = cells[1].textContent.trim();
                extractedData.consumidor_uf = cells[2].textContent.trim();
              }
            }
          }
        }
      }

      // b) Chave de acesso (no painel "Chave de acesso")
      const chavePanel = Array.from(accordion.querySelectorAll(".panel"))
        .find(panel => panel.textContent.toLowerCase().includes("chave de acesso"));
      if (chavePanel) {
        const chaveTd = chavePanel.querySelector("table tr td");
        if (chaveTd) {
          extractedData.chave_acesso = chaveTd.textContent.replace(/[^A-F0-9]/gi, '').trim();
          console.log('Chave extraída do accordion:', extractedData.chave_acesso);
        }
      }
      // c) Informações complementares
      const infoComplementarPanel = Array.from(accordion.querySelectorAll(".panel"))
        .find(panel => panel.textContent.toLowerCase().includes("informações complementares"));
      if (infoComplementarPanel) {
        const infoTd = infoComplementarPanel.querySelector("table tr td");
        if (infoTd) {
          extractedData.descricao = infoTd.textContent.trim();
        }
      }
      // d) Dados gerais da nota
      const infoNotaPanel = Array.from(accordion.querySelectorAll(".panel"))
        .find(panel => panel.textContent.toLowerCase().includes("informações gerais da nota"));
      if (infoNotaPanel) {
        const collapseDiv = infoNotaPanel.querySelector("div.collapse");
        if (collapseDiv) {
          // i. Emitente
          const emitenteTable = collapseDiv.querySelector("table.table-hover");
          if (emitenteTable) {
            const emitenteRow = emitenteTable.querySelector("tbody tr");
            if (emitenteRow) {
              const cells = emitenteRow.querySelectorAll("td");
              if (cells.length >= 4) {
                extractedData.empresa_nome = cells[0].textContent.trim();
                extractedData.empresa_cnpj = cells[1].textContent.trim();
                extractedData.empresa_ie = cells[2].textContent.trim();
                extractedData.uf = cells[3].textContent.trim();
              }
            }
          }
          // ii. Dados operacionais: Destino da operação, Consumidor final e Presença do Comprador
          const operacaoTable = Array.from(collapseDiv.querySelectorAll("table.table-hover"))
            .find(table => table.textContent.toLowerCase().includes("destino da operação"));
          if (operacaoTable) {
            const operacaoCells = operacaoTable.querySelectorAll("tbody tr td div");
            if (operacaoCells.length >= 3) {
              extractedData.destino_operacao = operacaoCells[0].textContent.trim().charAt(0);
              extractedData.consumidor_final = operacaoCells[1].textContent.trim().charAt(0);
              extractedData.presenca_comprador = operacaoCells[2].textContent.trim().charAt(0);
            }
          }
          // iii. Dados do cupom: Modelo, Série, Número, Data Emissão
          const notaDadosTable = Array.from(collapseDiv.querySelectorAll("table.table-hover"))
            .find(table => table.textContent.toLowerCase().includes("modelo") && table.textContent.toLowerCase().includes("data emissão"));
          if (notaDadosTable) {
            const notaRow = notaDadosTable.querySelector("tbody tr");
            if (notaRow) {
              const cells = notaRow.querySelectorAll("td");
              if (cells.length >= 4) {
                extractedData.modelo = cells[0].textContent.trim();
                extractedData.serie = cells[1].textContent.trim();
                extractedData.numero_cupom = cells[2].textContent.trim();
                const dataHora = cells[3].textContent.trim().split(' ');
                // Converte data  para o formato ISO
                const [dia, mes, ano] = dataHora[0].split('/');
                extractedData.data_emissao = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}` || '';
                extractedData.hora_emissao = dataHora[1] || '';
              }
            }
          }
          // iv. ICMS e serviço
          const icmsTable = Array.from(collapseDiv.querySelectorAll("table.table-hover"))
            .find(table => table.textContent.toLowerCase().includes("base de cálculo icms"));
          if (icmsTable) {
            const icmsRow = icmsTable.querySelector("tbody tr");
            if (icmsRow) {
              const cells = icmsRow.querySelectorAll("td");
              if (cells.length >= 3) {
                extractedData.base_calculo_icms = parseFloat(cells[1].textContent.replace(/[R\$\s]/g, '').replace(',', '.'));
                extractedData.valor_icms = parseFloat(cells[2].textContent.replace(/[R\$\s]/g, '').replace(',', '.'));
              }
            }
          }
          // v. Protocolo
          const protocoloTable = Array.from(collapseDiv.querySelectorAll("table.table-hover"))
            .find(table => table.textContent.toLowerCase().includes("protocolo"));
          if (protocoloTable) {
            const protocoloRow = protocoloTable.querySelector("tbody tr");
            if (protocoloRow) {
              extractedData.protocolo = protocoloRow.querySelector("td")?.textContent.trim() || '';
            }
          }
        }
      }
    } else {
      console.warn('Elemento "accordion" não encontrado.');
    }

    console.log('Extração concluída. Dados extraídos:', extractedData);
    return Object.keys(extractedData).length > 0 ? extractedData : null;
  } catch (error) {
    console.error('Erro ao extrair dados do HTML:', error);
    return null;
  }
};

export const detectDataType = (content: string): string => {
  if (content.includes('nfce.fazenda') || content.includes('chNFe=')) {
    return 'NFC-e';
  } else if (content.startsWith('http://') || content.startsWith('https://')) {
    return 'URL';
  } else if (content.includes('@') && content.includes('.')) {
    return 'Email';
  } else if (/^\d+$/.test(content)) {
    return 'Número';
  } else {
    return 'Texto';
  }
};