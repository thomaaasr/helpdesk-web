import { useEffect, useState, type FormEvent } from 'react';
import { buscarChamado, comentar, ErroApi, listarComentarios, type Chamado, type Comentario } from './api.ts';
import { formatarData, NOMES_PRIORIDADE, NOMES_STATUS } from './formatos.ts';

type Props = {
  token: string;
  chamadoId: number;
  aoVoltar: () => void;
  aoExpirarLogin: () => void;
};

function DetalheChamado({ token, chamadoId, aoVoltar, aoExpirarLogin }: Props) {
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

export default DetalheChamado;
