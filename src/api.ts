// Endereço da API. Em desenvolvimento, a API roda na porta 8000 do seu computador.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export type Perfil = 'solicitante' | 'tecnico';
export type Prioridade = 'baixa' | 'media' | 'alta' | 'critica';
export type StatusChamado = 'aberto' | 'em_atendimento' | 'resolvido' | 'fechado';

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
};

export type UsuarioResumo = Pick<Usuario, 'id' | 'nome'>;

export type Chamado = {
  id: number;
  titulo: string;
  descricao: string;
  solicitante: UsuarioResumo;
  tecnico: UsuarioResumo | null;
  prioridade: Prioridade;
  status: StatusChamado;
  prazo_em: string;
  resolvido_em: string | null;
  sla_estourado: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type NovoChamado = Pick<Chamado, 'titulo' | 'descricao' | 'prioridade'>;

export type Comentario = {
  id: number;
  texto: string;
  autor: UsuarioResumo;
  criado_em: string;
};

export type PaginaChamados = {
  itens: Chamado[];
  total: number;
  pagina: number;
  limite: number;
};

export type FiltrosChamados = {
  status?: StatusChamado;
  atrasados?: boolean;
  pagina: number;
  limite: number;
};

// Erro vindo da API, com o código HTTP e a mensagem já pronta para mostrar na tela.
export class ErroApi extends Error {
  readonly status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

// O FastAPI devolve o erro em "detail": um texto, ou uma lista quando a validação falha.
function mensagemDoErro(corpo: unknown, status: number): string {
  const detalhe = (corpo as { detail?: unknown } | null)?.detail;
  if (typeof detalhe === 'string') return detalhe;
  if (Array.isArray(detalhe)) return detalhe.map((item: { msg?: string }) => item.msg).join(' ');
  return `A API respondeu com o código ${status}.`;
}

// Faz a requisição e, se a API responder com erro, lança um ErroApi com a mensagem dela.
async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${API_URL}${caminho}`, opcoes);
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new ErroApi(resposta.status, mensagemDoErro(corpo, resposta.status));
  }
  return resposta.json();
}

function comToken(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// O login segue o padrão OAuth2: formulário com "username" (aqui, o e-mail) e "password".
export async function entrar(email: string, senha: string): Promise<string> {
  const corpo = new URLSearchParams({ username: email, password: senha });
  const resposta = await requisitar<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: corpo,
  });
  return resposta.access_token;
}

export function criarConta(nome: string, email: string, senha: string): Promise<Usuario> {
  return requisitar<Usuario>('/auth/cadastro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha }),
  });
}

export function buscarUsuarioLogado(token: string): Promise<Usuario> {
  return requisitar<Usuario>('/auth/eu', { headers: comToken(token) });
}

export function listarChamados(token: string, filtros: FiltrosChamados): Promise<PaginaChamados> {
  // Monta a query string só com os filtros preenchidos, por exemplo: ?status=aberto&pagina=2&limite=10
  const parametros = new URLSearchParams({
    pagina: String(filtros.pagina),
    limite: String(filtros.limite),
  });
  if (filtros.status) {
    parametros.set('status', filtros.status);
  }
  if (filtros.atrasados) {
    parametros.set('atrasados', 'true');
  }
  return requisitar<PaginaChamados>(`/chamados?${parametros}`, {
    headers: comToken(token),
  });
}

export function criarChamado(token: string, dados: NovoChamado): Promise<Chamado> {
  return requisitar<Chamado>('/chamados', {
    method: 'POST',
    headers: { ...comToken(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
}

export function buscarChamado(token: string, id: number): Promise<Chamado> {
  return requisitar<Chamado>(`/chamados/${id}`, { headers: comToken(token) });
}

export function listarComentarios(token: string, chamadoId: number): Promise<Comentario[]> {
  return requisitar<Comentario[]>(`/chamados/${chamadoId}/comentarios`, {
    headers: comToken(token),
  });
}

export function comentar(token: string, chamadoId: number, texto: string): Promise<Comentario> {
  return requisitar<Comentario>(`/chamados/${chamadoId}/comentarios`, {
    method: 'POST',
    headers: { ...comToken(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });
}

export function assumirChamado(token: string, id: number): Promise<Chamado> {
  return requisitar<Chamado>(`/chamados/${id}/assumir`, { method: 'POST', headers: comToken(token) });
}

export function mudarStatus(token: string, id: number, status: StatusChamado): Promise<Chamado> {
  return requisitar<Chamado>(`/chamados/${id}/status`, {
    method: 'PATCH',
    headers: { ...comToken(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function mudarPrioridade(token: string, id: number, prioridade: Prioridade): Promise<Chamado> {
  return requisitar<Chamado>(`/chamados/${id}`, {
    method: 'PATCH',
    headers: { ...comToken(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prioridade }),
  });
}
