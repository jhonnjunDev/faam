/* ========================================
   Sistema de Logs de Atividades (Supabase)
   ======================================== */

const Logs = {
  CHAVE_LOGS: 'faam_logs',
  MAX_LOGS: 500,

  // Registrar uma ação no log
  async registrar(tipo, acao, detalhes = '', usuario = null) {
    const sessao = usuario || Auth.obterSessao();
    const log = {
      id: Utils.gerarId(),
      tipo: tipo,
      acao: acao,
      detalhes: detalhes,
      usuario_nome: sessao ? sessao.nome : 'Sistema',
      usuario_perfil: sessao ? sessao.perfil : 'sistema',
      timestamp: new Date().toISOString()
    };

    if (DB.modoSupabase) {
      try {
        const { error } = await clientSupabase.from('logs').insert(log);
        if (error) console.error('Erro ao salvar log:', error);
      } catch (e) {
        console.error('Erro ao salvar log no Supabase:', e);
      }
    } else {
      let logs = this.obterLogs();
      logs.unshift(log);
      if (logs.length > this.MAX_LOGS) {
        logs = logs.slice(0, this.MAX_LOGS);
      }
      localStorage.setItem(this.CHAVE_LOGS, JSON.stringify(logs));
    }
  },

  // Obter todos os logs
  async obterLogs() {
    if (DB.modoSupabase) {
      try {
        const { data, error } = await clientSupabase
          .from('logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(this.MAX_LOGS);
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.error('Erro ao buscar logs:', e);
        return [];
      }
    }
    const dados = localStorage.getItem(this.CHAVE_LOGS);
    return dados ? JSON.parse(dados) : [];
  },

  // Obter logs filtrados
  async obterLogsFiltrados(filtroTipo = '') {
    if (DB.modoSupabase) {
      try {
        let query = clientSupabase
          .from('logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(this.MAX_LOGS);
        if (filtroTipo) {
          query = query.eq('tipo', filtroTipo);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.error('Erro ao buscar logs filtrados:', e);
        return [];
      }
    }
    let logs = this.obterLogs();
    if (filtroTipo) {
      logs = logs.filter(log => log.tipo === filtroTipo);
    }
    return logs;
  },

  // Limpar todos os logs
  async limparLogs() {
    if (DB.modoSupabase) {
      try {
        await clientSupabase.from('logs').delete().neq('id', '');
      } catch (e) {
        console.error('Erro ao limpar logs:', e);
      }
    } else {
      localStorage.removeItem(this.CHAVE_LOGS);
    }
    await this.registrar('sistema', 'Logs limpos por administrador');
  },

  // Registrar erro do sistema
  async registrarErro(origem, erro, detalhes = '') {
    await this.registrar('erro', origem, `${erro}${detalhes ? ' - ' + detalhes : ''}`);
  }
};

// Funções da página de logs
async function carregarLogs() {
  const tbody = document.getElementById('tabelaLogs');
  const estadoVazio = document.getElementById('estadoVazio');
  const filtroTipo = document.getElementById('filtroTipo').value;

  const logs = await Logs.obterLogsFiltrados(filtroTipo);

  if (logs.length === 0) {
    tbody.innerHTML = '';
    estadoVazio.style.display = 'block';
    return;
  }

  estadoVazio.style.display = 'none';

  const tipoCores = {
    login: { bg: '#ebf8ff', color: '#2b6cb0', icon: 'fa-sign-in-alt' },
    paciente: { bg: '#f0fff4', color: '#276749', icon: 'fa-user' },
    relatorio: { bg: '#fffff0', color: '#975a16', icon: 'fa-file-medical' },
    usuario: { bg: '#faf5ff', color: '#6b46c1', icon: 'fa-user-cog' },
    sistema: { bg: '#fff5f5', color: '#c53030', icon: 'fa-cog' },
    erro: { bg: '#fed7d7', color: '#c53030', icon: 'fa-exclamation-triangle' }
  };

  tbody.innerHTML = logs.map(log => {
    const estilo = tipoCores[log.tipo] || tipoCores.sistema;
    const data = new Date(log.timestamp);
    const dataFormatada = data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <tr>
        <td style="font-size:12px; color:var(--text-light); white-space:nowrap;">${dataFormatada}</td>
        <td>
          <span class="badge" style="background:${estilo.bg};color:${estilo.color};">
            <i class="fas ${estilo.icon}"></i> ${log.tipo.charAt(0).toUpperCase() + log.tipo.slice(1)}
          </span>
        </td>
        <td style="font-weight:600; font-size:13px;">${Utils.escapeHtml(log.usuario_nome)}</td>
        <td style="font-size:13px;">${Utils.escapeHtml(log.acao)}</td>
        <td style="font-size:12px; color:var(--text-light); max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${Utils.escapeHtml(log.detalhes || '-')}
        </td>
      </tr>
    `;
  }).join('');
}

async function limparLogs() {
  if (!Utils.confirmar('Deseja realmente limpar todos os logs?')) return;
  await Logs.limparLogs();
  await carregarLogs();
  Utils.mostrarToast('Logs limpos com sucesso!');
}

// Event listener para o filtro
document.addEventListener('DOMContentLoaded', () => {
  const filtroTipo = document.getElementById('filtroTipo');
  if (filtroTipo) {
    filtroTipo.addEventListener('change', async () => {
      await carregarLogs();
    });
  }
});
