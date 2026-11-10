import { useEffect, useState } from 'react';
import {
  buscarUsuarioLogado,
  ErroApi,
  listarChamados,
  type PaginaChamados,
  type StatusChamado,
  type Usuario,
} from './api.ts';
import DetalheChamado from './DetalheChamado.tsx';
import { formatarData, NOMES_PRIORIDADE, NOMES_STATUS } from './formatos.ts';
import Login from './Login.tsx';
import NovoChamado from './NovoChamado.tsx';

const ITENS_POR_PAGINA = 10;

// O token fica guardado no navegador para o login sobreviver a um F5.
function lerTokenSalvo() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

function salvarToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  } catch {
    // Se o navegador bloquear o armazenamento, o login vale só enquanto a página estiver aberta.
  }
}

function App() {
  const [token, setToken] = useState<string | null>(lerTokenSalvo);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pagina, setPagina] = useState<PaginaChamados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusChamado | ''>('');
  const [numeroPagina, setNumeroPagina] = useState(1);
  const [atrasados, setAtrasados] = useState(false);
  const [abrindoChamado, setAbrindoChamado] = useState(false);
  const [chamadoAberto, setChamadoAberto] = useState<number | null>(null);
  // Muda a cada alteração, para a lista buscar de novo.
  const [versaoLista, setVersaoLista] = useState(0);

  function trocarToken(novo: string | null) {
    salvarToken(novo);
    setToken(novo);
    if (!novo) {
      setUsuario(null);
      setPagina(null);
      setAbrindoChamado(false);
      setChamadoAberto(null);
    }
  }

  // Busca quem está logado e os chamados sempre que o login, o filtro ou a página mudar.
  useEffect(() => {
    if (!token) return;
    let cancelada = false;
    Promise.all([
      buscarUsuarioLogado(token),
      listarChamados(token, {
        status: status || undefined,
        atrasados,
        pagina: numeroPagina,
        limite: ITENS_POR_PAGINA,
      }),
    ])
      .then(([eu, resultado]) => {
        if (cancelada) return;
        setUsuario(eu);
        setPagina(resultado);
        setErro(null);
      })
      .catch((e: Error) => {
        if (cancelada) return;
        // Token vencido: volta para a tela de login.
        if (e instanceof ErroApi && e.status === 401) {
          trocarToken(null);
        } else {
          setErro(e.message);
        }
      });
    // Se algo mudar antes da resposta chegar, ignora a resposta antiga.
    return () => {
      cancelada = true;
    };
  }, [token, status, atrasados, numeroPagina, versaoLista]);

  const totalPaginas = pagina ? Math.max(1, Math.ceil(pagina.total / pagina.limite)) : 1;

  return (
    <main>
      <header>
        <h1>Help Desk</h1>
        {usuario && (
          <div className="usuario">
            <span>
              {usuario.nome} · {usuario.perfil === 'tecnico' ? 'Técnico' : 'Solicitante'}
            </span>
            <button onClick={() => trocarToken(null)}>Sair</button>
          </div>
        )}
      </header>

      {!token && <Login aoEntrar={trocarToken} />}

      {token && usuario && chamadoAberto !== null && (
        <DetalheChamado
          token={token}
          usuario={usuario}
          chamadoId={chamadoAberto}
          aoVoltar={() => {
            setChamadoAberto(null);
            setVersaoLista(versaoLista + 1);
          }}
          aoExpirarLogin={() => trocarToken(null)}
        />
      )}

      {token && chamadoAberto === null && (
        <>
          {abrindoChamado && (
            <NovoChamado
              token={token}
              aoCriar={() => {
                setAbrindoChamado(false);
                setStatus('');
                setNumeroPagina(1);
                setVersaoLista(versaoLista + 1);
              }}
              aoCancelar={() => setAbrindoChamado(false)}
              aoExpirarLogin={() => trocarToken(null)}
            />
          )}

          <div className="filtros">
            {!abrindoChamado && (
              <button className="principal" onClick={() => setAbrindoChamado(true)}>
                Abrir chamado
              </button>
            )}
            <select
              value={status}
              onChange={(evento) => {
                setStatus(evento.target.value as StatusChamado | '');
                setNumeroPagina(1);
              }}
            >
              <option value="">Todos os status</option>
              <option value="aberto">Aberto</option>
              <option value="em_atendimento">Em atendimento</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>
            <label className="opcao">
              <input
                type="checkbox"
                checked={atrasados}
                onChange={(evento) => {
                  setAtrasados(evento.target.checked);
                  setNumeroPagina(1);
                }}
              />
              Só atrasados
            </label>
          </div>

          {erro && <p className="erro">Não foi possível carregar os chamados: {erro}</p>}
          {!erro && !pagina && (
            <p>Carregando... No primeiro acesso, a API pode levar cerca de 1 minuto para acordar.</p>
          )}
          {pagina && pagina.itens.length === 0 && <p>Nenhum chamado encontrado.</p>}

          {pagina && pagina.itens.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Título</th>
                  <th>Solicitante</th>
                  <th>Técnico</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                {pagina.itens.map((chamado) => (
                  <tr key={chamado.id}>
                    <td>{chamado.id}</td>
                    <td>
                      <button className="link titulo" onClick={() => setChamadoAberto(chamado.id)}>
                        {chamado.titulo}
                      </button>
                    </td>
                    <td>{chamado.solicitante.nome}</td>
                    <td>{chamado.tecnico?.nome ?? '—'}</td>
                    <td>
                      <span className={`etiqueta ${chamado.prioridade}`}>{NOMES_PRIORIDADE[chamado.prioridade]}</span>
                    </td>
                    <td>
                      <span className={`etiqueta ${chamado.status}`}>{NOMES_STATUS[chamado.status]}</span>
                    </td>
                    <td className={chamado.sla_estourado ? 'atrasado' : undefined}>
                      {formatarData(chamado.prazo_em)}
                      {chamado.sla_estourado && ' · fora do prazo'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {pagina && pagina.total > 0 && (
            <div className="paginacao">
              <button disabled={numeroPagina <= 1} onClick={() => setNumeroPagina(numeroPagina - 1)}>
                Anterior
              </button>
              <span>
                Página {numeroPagina} de {totalPaginas} · {pagina.total} chamado(s)
              </span>
              <button disabled={numeroPagina >= totalPaginas} onClick={() => setNumeroPagina(numeroPagina + 1)}>
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default App;
