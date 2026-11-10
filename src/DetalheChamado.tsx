import { useEffect, useState, type FormEvent } from 'react';
import {
  assumirChamado,
  buscarChamado,
  comentar,
  ErroApi,
  listarComentarios,
  mudarPrioridade,
  mudarStatus,
  type Chamado,
  type Comentario,
  type Prioridade,
  type Usuario,
} from './api.ts';
import { formatarData, NOMES_PRIORIDADE, NOMES_STATUS } from './formatos.ts';

type Props = {
  token: string;
  usuario: Usuario;
  chamadoId: number;
  aoVoltar: () => void;
  aoExpirarLogin: () => void;
};

function DetalheChamado({ token, usuario, chamadoId, aoVoltar, aoExpirarLogin }: Props) {
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Muda a cada comentário, para buscar a lista de novo.
  const [versao, setVersao] = useState(0);

  function tratarErro(e: Error) {
    if (e instanceof ErroApi && e.status === 401) {
      aoExpirarLogin();
    } else {
      setErro(e.message);
    }
  }

  useEffect(() => {
    let cancelada = false;
    Promise.all([buscarChamado(token, chamadoId), listarComentarios(token, chamadoId)])
      .then(([dados, lista]) => {
        if (cancelada) return;
        setChamado(dados);
        setComentarios(lista);
      })
      .catch((e: Error) => {
        if (!cancelada) tratarErro(e);
      });
    return () => {
      cancelada = true;
    };
    // tratarErro é recriada a cada renderização e não deve disparar uma nova busca.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [token, chamadoId, versao]);

  // Executa uma ação do fluxo (assumir, resolver...) e mostra o chamado já atualizado.
  async function executar(acao: () => Promise<Chamado>) {
    setErro(null);
    setEnviando(true);
    try {
      setChamado(await acao());
    } catch (e) {
      tratarErro(e as Error);
    } finally {
      setEnviando(false);
    }
  }

  async function enviarComentario(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await comentar(token, chamadoId, texto);
      setTexto('');
      setVersao(versao + 1);
    } catch (e) {
      tratarErro(e as Error);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <button onClick={aoVoltar}>← Voltar para a lista</button>

      {erro && <p className="erro">{erro}</p>}
      {!erro && !chamado && <p>Carregando...</p>}

      {chamado && (
        <>
          <h2>
            #{chamado.id} · {chamado.titulo}
          </h2>
          <p className="etiquetas">
            <span className={`etiqueta ${chamado.status}`}>{NOMES_STATUS[chamado.status]}</span>
            <span className={`etiqueta ${chamado.prioridade}`}>{NOMES_PRIORIDADE[chamado.prioridade]}</span>
          </p>
          <p className="descricao">{chamado.descricao}</p>
          <dl className="dados">
            <dt>Solicitante</dt>
            <dd>{chamado.solicitante.nome}</dd>
            <dt>Técnico</dt>
            <dd>{chamado.tecnico?.nome ?? 'Ainda não assumido'}</dd>
            <dt>Aberto em</dt>
            <dd>{formatarData(chamado.criado_em)}</dd>
            <dt>Prazo</dt>
            <dd className={chamado.sla_estourado ? 'atrasado' : undefined}>
              {formatarData(chamado.prazo_em)}
              {chamado.sla_estourado && ' · fora do prazo'}
            </dd>
          </dl>

          <Acoes chamado={chamado} usuario={usuario} enviando={enviando} executar={executar} token={token} />

          <h3>Comentários</h3>
          {comentarios.length === 0 && <p className="dica">Nenhum comentário ainda.</p>}
          <ul className="comentarios">
            {comentarios.map((comentario) => (
              <li key={comentario.id}>
                <strong>{comentario.autor.nome}</strong>{' '}
                <span className="dica">{formatarData(comentario.criado_em)}</span>
                <p>{comentario.texto}</p>
              </li>
            ))}
          </ul>

          {chamado.status === 'fechado' ? (
            <p className="dica">Este chamado está fechado e não aceita novos comentários.</p>
          ) : (
            <form className="cartao" onSubmit={enviarComentario}>
              <textarea
                placeholder="Escreva um comentário"
                rows={3}
                maxLength={2000}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                required
              />
              <div className="acoes">
                <button type="submit" className="principal" disabled={enviando}>
                  Comentar
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}

type PropsAcoes = {
  token: string;
  chamado: Chamado;
  usuario: Usuario;
  enviando: boolean;
  executar: (acao: () => Promise<Chamado>) => void;
};

// Mostra só os botões que a API permite para este usuário e este status.
function Acoes({ token, chamado, usuario, enviando, executar }: PropsAcoes) {
  const tecnico = usuario.perfil === 'tecnico';
  const responsavel = chamado.tecnico?.id === usuario.id;
  const dono = chamado.solicitante.id === usuario.id;

  return (
    <div className="acoes">
      {tecnico && chamado.status === 'aberto' && (
        <button
          className="principal"
          disabled={enviando}
          onClick={() => executar(() => assumirChamado(token, chamado.id))}
        >
          Assumir chamado
        </button>
      )}
      {responsavel && chamado.status === 'em_atendimento' && (
        <button
          className="principal"
          disabled={enviando}
          onClick={() => executar(() => mudarStatus(token, chamado.id, 'resolvido'))}
        >
          Marcar como resolvido
        </button>
      )}
      {(tecnico || dono) && chamado.status === 'resolvido' && (
        <>
          <button
            className="principal"
            disabled={enviando}
            onClick={() => executar(() => mudarStatus(token, chamado.id, 'fechado'))}
          >
            Fechar chamado
          </button>
          <button disabled={enviando} onClick={() => executar(() => mudarStatus(token, chamado.id, 'em_atendimento'))}>
            Reabrir
          </button>
        </>
      )}
      {tecnico && chamado.status !== 'fechado' && (
        <label>
          Prioridade{' '}
          <select
            value={chamado.prioridade}
            disabled={enviando}
            onChange={(e) => executar(() => mudarPrioridade(token, chamado.id, e.target.value as Prioridade))}
          >
            <option value="baixa">Baixa (72h)</option>
            <option value="media">Média (24h)</option>
            <option value="alta">Alta (8h)</option>
            <option value="critica">Crítica (4h)</option>
          </select>
        </label>
      )}
    </div>
  );
}

export default DetalheChamado;
