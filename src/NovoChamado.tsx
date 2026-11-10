import { useState, type FormEvent } from 'react';
import { criarChamado, ErroApi, type Prioridade } from './api.ts';

type Props = {
  token: string;
  aoCriar: () => void;
  aoCancelar: () => void;
  aoExpirarLogin: () => void;
};

function NovoChamado({ token, aoCriar, aoCancelar, aoExpirarLogin }: Props) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('media');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await criarChamado(token, { titulo, descricao, prioridade });
      aoCriar();
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) {
        aoExpirarLogin();
        return;
      }
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="cartao" onSubmit={enviar}>
      <h2>Abrir chamado</h2>
      <input
        placeholder="Título (mínimo de 3 caracteres)"
        value={titulo}
        maxLength={120}
        onChange={(e) => setTitulo(e.target.value)}
        required
      />
      <textarea
        placeholder="Descreva o problema"
        rows={4}
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        required
      />
      <label>
        Prioridade{' '}
        <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)}>
          <option value="baixa">Baixa (72h)</option>
          <option value="media">Média (24h)</option>
          <option value="alta">Alta (8h)</option>
          <option value="critica">Crítica (4h)</option>
        </select>
      </label>
      {erro && <p className="erro">{erro}</p>}
      <div className="acoes">
        <button type="submit" className="principal" disabled={enviando}>
          Abrir chamado
        </button>
        <button type="button" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default NovoChamado;
