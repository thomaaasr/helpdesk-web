import type { Chamado, Usuario } from '../api.ts';

// Dados de exemplo usados nos testes.
export const ana: Usuario = { id: 1, nome: 'Ana Souza', email: 'ana@exemplo.com', perfil: 'solicitante' };
export const carlos: Usuario = { id: 2, nome: 'Carlos Lima', email: 'carlos@exemplo.com', perfil: 'tecnico' };

export function criarChamado(dados: Partial<Chamado> = {}): Chamado {
  return {
    id: 7,
    titulo: 'Impressora não imprime',
    descricao: 'A impressora do financeiro parou.',
    solicitante: { id: ana.id, nome: ana.nome },
    tecnico: null,
    prioridade: 'media',
    status: 'aberto',
    prazo_em: '2026-11-11T12:00:00Z',
    resolvido_em: null,
    sla_estourado: false,
    criado_em: '2026-11-10T12:00:00Z',
    atualizado_em: '2026-11-10T12:00:00Z',
    ...dados,
  };
}
