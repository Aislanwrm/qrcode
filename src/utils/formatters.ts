import { CupomFiscal } from '../hooks/useCupomFiscal';

export function formatCNPJ(cnpj: string = ''): string {
  const num = cnpj.replace(/[^\d]/g, '');
  return num.length === 14
    ? num.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    : cnpj;
}

export function formatCPF(cpf: string = ''): string {
  const num = cpf.replace(/[^\d]/g, '');
  return num.length === 11
    ? num.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
    : cpf;
}

export function formatCEP(cep: string = ''): string {
  const num = cep.replace(/[^\d]/g, '');
  return num.length === 8
    ? num.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2-$3')
    : cep;
}

export function formatCupom(cupom: CupomFiscal): CupomFiscal {
  return {
    ...cupom,
    empresa_cnpj: formatCNPJ(cupom.empresa_cnpj),
    consumidor_cpf: formatCPF(cupom.consumidor_cpf),
    cep: formatCEP(cupom.cep),
  };
}