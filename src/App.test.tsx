import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App.tsx';
import { chamada, simularApi } from './testes/api-falsa.ts';
import { carlos, criarChamado } from './testes/dados.ts';

function entrarComoTecnico() {
  localStorage.setItem('token', 'token-salvo');
  return simularApi({
    'GET /auth/eu': { corpo: carlos },
    'GET /chamados': {
      corpo: { itens: [criarChamado({ sla_estourado: true })], total: 1, pagina: 1, limite: 10 },
    },
  });
}

describe('App', () => {
  it('sem login, mostra a tela de entrar', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('com login salvo, mostra quem está logado e a lista de chamados', async () => {
    const fetchFalso = entrarComoTecnico();
    render(<App />);

    expect(await screen.findByText('Impressora não imprime')).toBeInTheDocument();
    expect(screen.getByText('Carlos Lima · Técnico')).toBeInTheDocument();
    expect(screen.getByText(/fora do prazo/)).toBeInTheDocument();
    expect(chamada(fetchFalso, 1).cabecalhos?.Authorization).toBe('Bearer token-salvo');
  });

  it('o filtro "Só atrasados" vai para a consulta da API', async () => {
    const fetchFalso = entrarComoTecnico();
    render(<App />);
    await screen.findByText('Impressora não imprime');

    await userEvent.setup().click(screen.getByLabelText('Só atrasados'));

    const ultima = chamada(fetchFalso, fetchFalso.mock.calls.length - 1);
    expect(ultima.caminho).toBe('/chamados');
    expect(ultima.consulta.atrasados).toBe('true');
  });

  it('com o login vencido (401), volta para a tela de entrar', async () => {
    localStorage.setItem('token', 'token-velho');
    simularApi({
      'GET /auth/eu': { status: 401, corpo: { detail: 'Token inválido ou expirado.' } },
      'GET /chamados': { status: 401, corpo: { detail: 'Token inválido ou expirado.' } },
    });
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
