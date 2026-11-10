import { vi } from 'vitest';

type Rota = { status?: number; corpo: unknown };

// Troca o fetch do navegador por uma versão falsa: cada rota responde o que o teste definir,
// sem precisar da API rodando. A chave é "MÉTODO /caminho", por exemplo "POST /auth/login".
export function simularApi(rotas: Record<string, Rota>) {
  const fetchFalso = vi.fn(async (url: string, opcoes: RequestInit = {}) => {
    const { pathname } = new URL(url);
    const chave = `${opcoes.method ?? 'GET'} ${pathname}`;
    const rota = rotas[chave];
    if (!rota) {
      throw new Error(`Rota não simulada no teste: ${chave}`);
    }
    return new Response(JSON.stringify(rota.corpo), { status: rota.status ?? 200 });
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

// Dados da chamada número `indice` feita ao fetch falso.
export function chamada(fetchFalso: ReturnType<typeof simularApi>, indice: number) {
  const [url, opcoes = {}] = fetchFalso.mock.calls[indice];
  const { pathname, searchParams } = new URL(url);
  // O login manda um formulário; as outras rotas mandam JSON.
  const corpo =
    opcoes.body instanceof URLSearchParams
      ? Object.fromEntries(opcoes.body)
      : opcoes.body
        ? JSON.parse(String(opcoes.body))
        : undefined;
  return {
    caminho: pathname,
    consulta: Object.fromEntries(searchParams),
    metodo: opcoes.method ?? 'GET',
    corpo,
    cabecalhos: opcoes.headers as Record<string, string> | undefined,
  };
}
