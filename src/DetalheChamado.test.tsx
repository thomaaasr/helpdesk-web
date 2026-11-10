import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Chamado, Usuario } from './api.ts';
import DetalheChamado from './DetalheChamado.tsx';
import { chamada, simularApi } from './testes/api-falsa.ts';
import { ana, carlos, criarChamado } from './testes/dados.ts';

function abrir(chamado: Chamado, usuario: Usuario, rotasExtras = {}) {
  const fetchFalso = simularApi({
    'GET /chamados/7': { corpo: chamado },
    'GET /chamados/7/comentarios': { corpo: [] },
    ...rotasExtras,
  });
  render(<DetalheChamado token="token" usuario={usuario} chamadoId={7} aoVoltar={vi.fn()} aoExpirarLogin={vi.fn()} />);
  return fetchFalso;
}

describe('DetalheChamado', () => {
  it('técnico assume um chamado aberto e vira o responsável', async () => {
    const assumido = criarChamado({ status: 'em_atendimento', tecnico: { id: carlos.id, nome: carlos.nome } });
    const fetchFalso = abrir(criarChamado(), carlos, { 'POST /chamados/7/assumir': { corpo: assumido } });

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Assumir chamado' }));

    expect(await screen.findByRole('button', { name: 'Marcar como resolvido' })).toBeInTheDocument();
    expect(chamada(fetchFalso, 2).metodo).toBe('POST');
  });

  it('solicitante não vê os botões do técnico', async () => {
    abrir(criarChamado(), ana);

    await screen.findByText('Impressora não imprime', { exact: false });
    expect(screen.queryByRole('button', { name: 'Assumir chamado' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('o dono fecha o chamado depois de resolvido', async () => {
    const resolvido = criarChamado({ status: 'resolvido', tecnico: { id: carlos.id, nome: carlos.nome } });
    const fetchFalso = abrir(resolvido, ana, {
      'PATCH /chamados/7/status': { corpo: { ...resolvido, status: 'fechado' } },
    });

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Fechar chamado' }));

    expect(chamada(fetchFalso, 2).corpo).toEqual({ status: 'fechado' });
    expect(await screen.findByText(/não aceita novos comentários/)).toBeInTheDocument();
  });

  it('mostra a mensagem da API quando a ação é recusada', async () => {
    abrir(criarChamado(), carlos, {
      'POST /chamados/7/assumir': { status: 409, corpo: { detail: 'Somente chamados abertos podem ser assumidos.' } },
    });

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Assumir chamado' }));

    expect(await screen.findByText('Somente chamados abertos podem ser assumidos.')).toBeInTheDocument();
  });
});
