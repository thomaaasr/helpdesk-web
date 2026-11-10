export const NOMES_STATUS = {
  aberto: 'Aberto',
  em_atendimento: 'Em atendimento',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

export const NOMES_PRIORIDADE = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
