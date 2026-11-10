import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Login from './Login.tsx';
import { chamada, simularApi } from './testes/api-falsa.ts';

async function preencher(email: string, senha: string) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByPlaceholderText('E-mail'), email);
  await usuario.type(screen.getByPlaceholderText(/Senha/), senha);
  return usuario;
}

describe('Login', () => {
  it('entra e entrega o token recebido da API', async () => {
    const fetchFalso = simularApi({ 'POST /auth/login': { corpo: { access_token: 'token-de-teste' } } });
    const aoEntrar = vi.fn();
    render(<Login aoEntrar={aoEntrar} />);

    const usuario = await preencher('ana@exemplo.com', 'senha-forte-123');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(aoEntrar).toHaveBeenCalledWith('token-de-teste');
    // O padrão OAuth2 chama o e-mail de "username".
    expect(chamada(fetchFalso, 0).corpo).toEqual({ username: 'ana@exemplo.com', password: 'senha-forte-123' });
  });

  it('mostra a mensagem de erro da API', async () => {
    simularApi({ 'POST /auth/login': { status: 401, corpo: { detail: 'E-mail ou senha incorretos.' } } });
    const aoEntrar = vi.fn();
    render(<Login aoEntrar={aoEntrar} />);

    const usuario = await preencher('ana@exemplo.com', 'senha-errada');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument();
    expect(aoEntrar).not.toHaveBeenCalled();
  });

  it('ao criar conta, cadastra com o nome e já entra em seguida', async () => {
    const fetchFalso = simularApi({
      'POST /auth/cadastro': { status: 201, corpo: { id: 1 } },
      'POST /auth/login': { corpo: { access_token: 'token-novo' } },
    });
    const aoEntrar = vi.fn();
    render(<Login aoEntrar={aoEntrar} />);
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole('button', { name: 'Não tem conta? Criar conta' }));
    await usuario.type(screen.getByPlaceholderText('Nome'), 'Ana Souza');
    await preencher('ana@exemplo.com', 'senha-forte-123');
    await usuario.click(screen.getByRole('button', { name: 'Criar conta e entrar' }));

    expect(chamada(fetchFalso, 0).corpo).toEqual({
      nome: 'Ana Souza',
      email: 'ana@exemplo.com',
      senha: 'senha-forte-123',
    });
    expect(aoEntrar).toHaveBeenCalledWith('token-novo');
  });
});
