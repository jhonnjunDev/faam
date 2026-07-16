/* ========================================
   Sistema de Logs de Atividades
   ======================================== */

const Logs = {
  CHAVE_LOGS: 'faam_logs',
  MAX_LOGS: 500,

  // Registrar uma ação no log
  registrar(tipo, acao, detalhes = '', usuario = null) {
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

    let logs = this.obterLogs();
    logs.unshift(log);

    // Manter apenas os últimos MAX_LOGS
    if (logs.length > this.MAX_LOGS) {
      logs = logs.slice(0, this.MAX_LOGS);
    }

    localStorage.setItem(this.CHAVE_LOGS, JSON.stringify(logs));
  },

  // Obter todos os logs
  obterLogs() {
    const dados = localStorage.getItem(this.CHAVE_LOGS);
    return dados ? JSON.parse(dados) : [];
  },

  // Obter logs filtrados
  obterLogsFiltrados(filtroTipo = '') {
    let logs = this.obterLogs();
    if (filtroTipo) {
      logs = logs.filter(log => log.tipo === filtroTipo);
    }
    return logs;
  },

  // Limpar todos os logs
  limparLogs() {
    localStorage.removeItem(this.CHAVE_LOGS);
    this.registrar('sistema', 'Logs limpos por administrador');
  }
};

// Funções da página de logs
function carregarLogs() {
  const tbody = document.getElementById('tabelaLogs');
  const estadoVazio = document.getElementById('estadoVazio');
  const filtroTipo = document.getElementById('filtroTipo').value;

  const logs = Logs.obterLogsFiltrados(filtroTipo);

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
    sistema: { bg: '#fff5f5', color: '#c53030', icon: 'fa-cog' }
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

function limparLogs() {
  if (!Utils.confirmar('Deseja realmente limpar todos os logs?')) return;
  Logs.limparLogs();
  carregarLogs();
  Utils.mostrarToast('Logs limpos com sucesso!');
}

// Event listener para o filtro
document.addEventListener('DOMContentLoaded', () => {
  const filtroTipo = document.getElementById('filtroTipo');
  if (filtroTipo) {
    filtroTipo.addEventListener('change', carregarLogs);
  }
});
