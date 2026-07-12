/* ========================================
   Sistema de Autenticação (Supabase + localStorage)
   ======================================== */

const Auth = {
  CHAVE_USUARIOS: 'usuarios_faam',
  CHAVE_SESSAO: 'sessao_atual',
  ADMIN_EMAIL: 'admin23@icloud',
  ADMIN_CODIGO: '2301',

  async init() {
    const usuarios = await this.obterUsuarios();
    if (usuarios.length === 0) {
      await this.criarUsuariosIniciais();
    }
  },

  async criarUsuariosIniciais() {
    const usuariosPadrao = [
      {
        id: 'admin001',
        nome: 'Administrador',
        email: this.ADMIN_EMAIL,
        codigo: this.ADMIN_CODIGO,
        perfil: 'admin',
        criado_em: new Date().toISOString()
      },
      {
        id: 'medico001',
        nome: 'Médico Sistema',
        email: 'sistema@faam.com',
        codigo: 'faam1',
        perfil: 'medico',
        criado_em: new Date().toISOString()
      }
    ];

    if (DB.modoSupabase) {
      for (const u of usuariosPadrao) {
        const { error } = await supabase.from('usuarios').upsert(u);
        if (error) console.error('Erro ao criar usuário:', error);
      }
    } else {
      localStorage.setItem(this.CHAVE_USUARIOS, JSON.stringify(usuariosPadrao));
    }
  },

  async obterUsuarios() {
    if (DB.modoSupabase) {
      const { data, error } = await supabase.from('usuarios').select('*');
      if (error) { console.error(error); return []; }
      return data || [];
    }
    const dados = localStorage.getItem(this.CHAVE_USUARIOS);
    return dados ? JSON.parse(dados) : [];
  },

  async login(email, codigo) {
    const usuarios = await this.obterUsuarios();
    const usuario = usuarios.find(u => u.email === email && u.codigo === codigo);

    if (usuario) {
      const sessao = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        login_em: new Date().toISOString()
      };
      sessionStorage.setItem(this.CHAVE_SESSAO, JSON.stringify(sessao));
      return { sucesso: true, usuario: sessao };
    }
    return { sucesso: false, erro: 'E-mail ou código incorretos' };
  },

  logout() {
    sessionStorage.removeItem(this.CHAVE_SESSAO);
    window.location.href = 'index.html';
  },

  obterSessao() {
    const dados = sessionStorage.getItem(this.CHAVE_SESSAO);
    return dados ? JSON.parse(dados) : null;
  },

  estaAutenticado() {
    return this.obterSessao() !== null;
  },

  podeAcessar(recurso) {
    const sessao = this.obterSessao();
    if (!sessao) return false;

    const permissoes = {
      'admin': ['dashboard', 'pacientes', 'paciente_novo', 'paciente_editar', 'paciente_ficha', 'relatorios', 'relatorio_novo', 'relatorio_detalhe', 'usuarios'],
      'medico': ['dashboard', 'pacientes', 'paciente_novo', 'paciente_editar', 'paciente_ficha', 'relatorios', 'relatorio_novo', 'relatorio_detalhe'],
      'assistente_social': ['dashboard', 'pacientes', 'paciente_ficha', 'relatorios', 'relatorio_detalhe']
    };

    return (permissoes[sessao.perfil] || []).includes(recurso);
  },

  async cadastrarUsuario(dados) {
    const usuarios = await this.obterUsuarios();

    if (usuarios.find(u => u.email === dados.email)) {
      return { sucesso: false, erro: 'E-mail já cadastrado' };
    }

    // Usar o código que o admin digitou
    const codigo = dados.codigo;

    const novoUsuario = {
      id: Utils.gerarId(),
      nome: dados.nome,
      email: dados.email,
      codigo: codigo,
      perfil: dados.perfil,
      criado_em: new Date().toISOString()
    };

    if (DB.modoSupabase) {
      const { error } = await supabase.from('usuarios').insert(novoUsuario);
      if (error) {
        console.error(error);
        return { sucesso: false, erro: 'Erro ao cadastrar usuário.' };
      }
    } else {
      usuarios.push(novoUsuario);
      localStorage.setItem(this.CHAVE_USUARIOS, JSON.stringify(usuarios));
    }

    return { sucesso: true, codigo: codigo };
  },

  gerarCodigo() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  },

  renderizarSidebar(paginaAtual) {
    const sessao = this.obterSessao();
    if (!sessao) return;

    const iniciais = Utils.obterIniciais(sessao.nome);
    const perfilLabel = { admin: 'Administrador', medico: 'Médico', assistente_social: 'Assist. Social' };

    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <h2><i class="fas fa-heartbeat"></i> FAAM</h2>
          <p>Sistema de Gestão Médica</p>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section">Principal</div>
          <a href="dashboard.html" class="${paginaAtual === 'dashboard' ? 'active' : ''}">
            <i class="fas fa-th-large"></i> Dashboard
          </a>

          <div class="nav-section">Pacientes</div>
          <a href="pacientes.html" class="${paginaAtual === 'pacientes' ? 'active' : ''}">
            <i class="fas fa-users"></i> Listar Pacientes
          </a>
          ${sessao.perfil !== 'assistente_social' ? `
          <a href="paciente-novo.html" class="${paginaAtual === 'paciente-novo' ? 'active' : ''}">
            <i class="fas fa-user-plus"></i> Novo Paciente
          </a>` : ''}

          <div class="nav-section">Relatórios</div>
          <a href="relatorios.html" class="${paginaAtual === 'relatorios' ? 'active' : ''}">
            <i class="fas fa-file-medical"></i> Relatórios
          </a>
          ${sessao.perfil !== 'assistente_social' ? `
          <a href="relatorio-novo.html" class="${paginaAtual === 'relatorio-novo' ? 'active' : ''}">
            <i class="fas fa-plus-circle"></i> Novo Relatório
          </a>` : ''}

          ${sessao.perfil === 'admin' ? `
          <div class="nav-section">Sistema</div>
          <a href="usuarios.html" class="${paginaAtual === 'usuarios' ? 'active' : ''}">
            <i class="fas fa-user-cog"></i> Gerenciar Usuários
          </a>` : ''}
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">${iniciais}</div>
            <div>
              <div class="user-name">${Utils.escapeHtml(sessao.nome)}</div>
              <div class="user-role">${perfilLabel[sessao.perfil] || sessao.perfil}</div>
            </div>
          </div>
          <button class="btn-logout" onclick="Auth.logout()">
            <i class="fas fa-sign-out-alt"></i> Sair
          </button>
        </div>
      </aside>
    `;
  },

  renderizarTopbar(titulo, breadcrumb) {
    const modo = DB.modoSupabase ? '☁️' : '📦';
    const tituloModo = DB.modoSupabase ? 'Sincronizado' : 'Offline';
    return `
      <header class="topbar">
        <div>
          <button class="btn btn-icon btn-outline no-print d-md-none" onclick="document.getElementById('sidebar').classList.toggle('open')" style="margin-right:12px">
            <i class="fas fa-bars"></i>
          </button>
          <h1>${titulo}</h1>
          ${breadcrumb ? `<div class="breadcrumb">${breadcrumb}</div>` : ''}
        </div>
        <div class="no-print d-flex align-center gap-2">
          <span title="${tituloModo}" style="font-size:16px; cursor:help;">${modo}</span>
          <span class="text-muted" style="font-size:13px" id="relogio"></span>
        </div>
      </header>
    `;
  },

  iniciarRelogio() {
    const el = document.getElementById('relogio');
    if (!el) return;
    const atualizar = () => {
      el.textContent = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    };
    atualizar();
    setInterval(atualizar, 30000);
  }
};

// Flag global para indicar que auth.js está pronto
window.AuthPronto = false;

// Inicializar auth em todas as páginas (exceto login)
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await DB.init();
  } catch (e) {
    console.warn('DB.init() com erro:', e);
  }

  try {
    await Auth.init();
  } catch (e) {
    console.warn('Auth.init() com erro:', e);
  }

  const pagina = document.body.dataset.pagina;
  if (pagina && pagina !== 'login') {
    if (!Auth.estaAutenticado()) {
      window.location.href = 'index.html';
      return;
    }

    // Inserir sidebar e topbar
    const layout = document.querySelector('.app-layout');
    if (layout) {
      const sidebarHtml = Auth.renderizarSidebar(pagina);
      const titulo = document.body.dataset.titulo || '';
      const breadcrumb = document.body.dataset.breadcrumb || '';
      const topbarHtml = Auth.renderizarTopbar(titulo, breadcrumb);

      layout.insertAdjacentHTML('afterbegin', sidebarHtml);
      const mainContent = layout.querySelector('.main-content');
      if (mainContent) {
        mainContent.insertAdjacentHTML('afterbegin', topbarHtml);
      }
    }

    Auth.iniciarRelogio();
  }

  // Marcar que auth.js está pronto
  window.AuthPronto = true;
});
