/* ========================================
   Sistema de Autenticação (Supabase + localStorage)
   ======================================== */

const Auth = {
  CHAVE_USUARIOS: 'usuarios_faam',
  CHAVE_SESSAO: 'sessao_atual',
  MAX_TENTATIVAS: 5,
  BLOQUEIO_MS: 300000, // 5 minutos
  SESSAO_EXPIRA_MS: 3600000, // 1 hora
  // Chave HMAC para assinar sessões (protege contra adulteração no console)
  _hmacKey: 'faam-session-key-2024',

  async init() {
    const usuarios = await this.obterUsuarios();
    if (usuarios.length === 0) {
      await this.criarUsuariosIniciais();
    }
    // Validar sessão existente
    if (!this.validarSessao()) {
      sessionStorage.removeItem(this.CHAVE_SESSAO);
    }
  },

  // Hash HMAC-SHA256 para proteger dados sensíveis
  async _hmac(data) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this._hmacKey);
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Hash SHA-256 simples para códigos de acesso
  async _hashCodigo(codigo) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codigo);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Gerar token de sessão assinado com HMAC
  async _gerarTokenSessao(dados) {
    const payload = JSON.stringify(dados);
    const hmac = await this._hmac(payload);
    return btoa(JSON.stringify({ payload: dados, hmac }));
  },

  // Validar e decodificar token de sessão
  async _validarToken(token) {
    try {
      const decoded = JSON.parse(atob(token));
      const hmacValido = await this._hmac(JSON.stringify(decoded.payload));
      if (decoded.hmac !== hmacValido) return null;
      // Verificar expiração
      if (decoded.payload.login_em) {
        const loginTime = new Date(decoded.payload.login_em).getTime();
        if (Date.now() - loginTime > this.SESSAO_EXPIRA_MS) return null;
      }
      return decoded.payload;
    } catch {
      return null;
    }
  },

  async criarUsuariosIniciais() {
    // Usuários iniciais com códigos hasheados
    // IMPORTANTE: Estas são credenciais padrão. O admin deve alterá-las após primeiro login.
    const adminHash = await this._hashCodigo('Admin@2024');
    const adminFaamHash = await this._hashCodigo('Faam2026');
    const medicoHash = await this._hashCodigo('Medico@2024');
    const adminMasterHash = await this._hashCodigo('@JY2026');

    const usuariosPadrao = [
      {
        id: 'admin001',
        nome: 'Administrador',
        email: 'admin23@icloud',
        codigo: null,
        codigo_hash: adminHash,
        perfil: 'admin',
        criado_em: new Date().toISOString()
      },
      {
        id: 'admin002',
        nome: 'Administrador FAAM',
        email: 'Admin@faam.com',
        codigo: null,
        codigo_hash: adminFaamHash,
        perfil: 'admin',
        criado_em: new Date().toISOString()
      },
      {
        id: 'admin_master001',
        nome: 'Admin Master',
        email: 'Admin@Jhon.com',
        codigo: null,
        codigo_hash: adminMasterHash,
        perfil: 'admin_master',
        criado_em: new Date().toISOString()
      },
      {
        id: 'medico001',
        nome: 'Médico Sistema',
        email: 'sistema@faam.com',
        codigo: null,
        codigo_hash: medicoHash,
        perfil: 'medico',
        criado_em: new Date().toISOString()
      }
    ];

    if (DB.modoSupabase) {
      for (const u of usuariosPadrao) {
        const { error } = await clientSupabase.from('usuarios').upsert(u);
        if (error) console.error('Erro ao criar usuário:', error);
      }
    } else {
      localStorage.setItem(this.CHAVE_USUARIOS, JSON.stringify(usuariosPadrao));
    }
  },

  async obterUsuarios() {
    if (DB.modoSupabase) {
      const { data, error } = await clientSupabase.from('usuarios').select('*');
      if (error) { console.error(error); return []; }
      return data || [];
    }
    const dados = localStorage.getItem(this.CHAVE_USUARIOS);
    return dados ? JSON.parse(dados) : [];
  },

  async login(email, codigo) {
    // Proteção contra brute force
    const chaveTentativas = 'tentativas_login_' + email;
    const tentativas = JSON.parse(localStorage.getItem(chaveTentativas) || '{"count":0,"bloqueado_ate":0}');

    if (tentativas.bloqueado_ate > Date.now()) {
      const minutos = Math.ceil((tentativas.bloqueado_ate - Date.now()) / 60000);
      return { sucesso: false, erro: `Conta bloqueada. Tente em ${minutos} minuto(s).` };
    }

    const codigoHash = await this._hashCodigo(codigo);
    const usuarios = await this.obterUsuarios();
    // Buscar por email e comparar hash do código
    const usuario = usuarios.find(u => u.email === email && (u.codigo_hash === codigoHash || u.codigo === codigo));

    if (usuario) {
      // Verificar se usuário está bloqueado pelo admin
      if (usuario.status === 'bloqueado') {
        return { sucesso: false, erro: 'Esta conta foi bloqueada pelo administrador.' };
      }

      // Login bem-sucedido, limpar tentativas
      localStorage.removeItem(chaveTentativas);

      // Migrar código antigo para hash se necessário
      if (usuario.codigo && !usuario.codigo_hash) {
        await this._migrarCodigo(usuario.id, usuario.codigo);
      }

      const sessao = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        login_em: new Date().toISOString()
      };

      // Assinar sessão com HMAC
      const token = await this._gerarTokenSessao(sessao);
      sessionStorage.setItem(this.CHAVE_SESSAO, token);
      this.registrarOnline();

      // Registrar auditoria
      if (typeof Auditoria !== 'undefined') {
        Auditoria.registrar('Login realizado', 'sistema', `E-mail: ${email}`);
      }

      return { sucesso: true, usuario: sessao };
    }

    // Login falhou, registrar tentativa
    tentativas.count++;
    if (tentativas.count >= this.MAX_TENTATIVAS) {
      tentativas.bloqueado_ate = Date.now() + this.BLOQUEIO_MS;
      tentativas.count = 0;
    }
    localStorage.setItem(chaveTentativas, JSON.stringify(tentativas));
    return { sucesso: false, erro: 'E-mail ou código incorretos' };
  },

  // Migrar código em texto plano para hash
  async _migrarCodigo(usuarioId, codigo) {
    const hash = await this._hashCodigo(codigo);
    if (DB.modoSupabase) {
      await clientSupabase.from('usuarios').update({ codigo_hash: hash, codigo: null }).eq('id', usuarioId);
    } else {
      const usuarios = await this.obterUsuarios();
      const idx = usuarios.findIndex(u => u.id === usuarioId);
      if (idx !== -1) {
        usuarios[idx].codigo_hash = hash;
        delete usuarios[idx].codigo;
        localStorage.setItem(this.CHAVE_USUARIOS, JSON.stringify(usuarios));
      }
    }
  },

  // Validar sessão: verificar HMAC e expiração
  validarSessao() {
    const token = sessionStorage.getItem(this.CHAVE_SESSAO);
    if (!token) return false;

    try {
      const decoded = JSON.parse(atob(token));
      // Verificar se tem os campos obrigatórios
      if (!decoded.payload || !decoded.hmac) return false;
      // Verificar expiração (síncrono para validação rápida)
      if (decoded.payload.login_em) {
        const loginTime = new Date(decoded.payload.login_em).getTime();
        if (Date.now() - loginTime > this.SESSAO_EXPIRA_MS) return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  logout() {
    this.removerOnline();
    sessionStorage.removeItem(this.CHAVE_SESSAO);
    window.location.href = 'index.html';
  },

  // ========== PRESENÇA (ONLINE) ==========
  CHAVE_ONLINE: 'usuarios_online',

  registrarOnline() {
    const sessao = this.obterSessao();
    if (!sessao) return;
    let online = JSON.parse(localStorage.getItem(this.CHAVE_ONLINE) || '{}');
    online[sessao.id] = { nome: sessao.nome, perfil: sessao.perfil, timestamp: Date.now() };
    localStorage.setItem(this.CHAVE_ONLINE, JSON.stringify(online));

    // Heartbeat a cada 30s
    if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
    this._heartbeatInterval = setInterval(() => {
      let o = JSON.parse(localStorage.getItem(this.CHAVE_ONLINE) || '{}');
      if (sessao.id) {
        o[sessao.id] = { nome: sessao.nome, perfil: sessao.perfil, timestamp: Date.now() };
        localStorage.setItem(this.CHAVE_ONLINE, JSON.stringify(o));
      }
    }, 30000);

    // Limpar ao fechar aba
    window.addEventListener('beforeunload', () => this.removerOnline());
  },

  removerOnline() {
    const sessao = this.obterSessao();
    if (!sessao) return;
    let online = JSON.parse(localStorage.getItem(this.CHAVE_ONLINE) || '{}');
    delete online[sessao.id];
    localStorage.setItem(this.CHAVE_ONLINE, JSON.stringify(online));
    if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
  },

  obterOnline() {
    const online = JSON.parse(localStorage.getItem(this.CHAVE_ONLINE) || '{}');
    const agora = Date.now();
    const LIMITE_MS = 60000; // 60s sem heartbeat = offline
    const resultado = {};
    for (const [id, dados] of Object.entries(online)) {
      if (agora - dados.timestamp < LIMITE_MS) {
        resultado[id] = dados;
      }
    }
    return resultado;
  },

  estaOnline(usuarioId) {
    const online = this.obterOnline();
    return !!online[usuarioId];
  },

  obterSessao() {
    const token = sessionStorage.getItem(this.CHAVE_SESSAO);
    if (!token) return null;
    try {
      const decoded = JSON.parse(atob(token));
      return decoded.payload || null;
    } catch {
      return null;
    }
  },

  estaAutenticado() {
    const sessao = this.obterSessao();
    if (!sessao) return false;
    // Verificar expiração
    if (sessao.login_em) {
      const loginTime = new Date(sessao.login_em).getTime();
      if (Date.now() - loginTime > this.SESSAO_EXPIRA_MS) {
        sessionStorage.removeItem(this.CHAVE_SESSAO);
        return false;
      }
    }
    return true;
  },

  podeAcessar(recurso) {
    const sessao = this.obterSessao();
    if (!sessao) return false;

    const permissoes = {
      'admin': ['dashboard', 'pacientes', 'paciente_novo', 'paciente_editar', 'paciente_ficha', 'relatorios', 'relatorio_novo', 'relatorio_detalhe', 'usuarios'],
      'admin_master': ['dashboard', 'pacientes', 'paciente_novo', 'paciente_editar', 'paciente_ficha', 'relatorios', 'relatorio_novo', 'relatorio_detalhe', 'usuarios', 'auditoria'],
      'medico': ['dashboard', 'pacientes', 'paciente_novo', 'paciente_editar', 'paciente_ficha', 'relatorios', 'relatorio_novo', 'relatorio_detalhe'],
      'enfermeiro': ['dashboard', 'pacientes', 'paciente_novo', 'paciente_editar', 'paciente_ficha', 'relatorios', 'relatorio_novo', 'relatorio_detalhe'],
      'tecnico_enfermagem': ['dashboard', 'pacientes', 'paciente_ficha', 'relatorios', 'relatorio_novo', 'relatorio_detalhe'],
      'assistente_social': ['dashboard', 'pacientes', 'paciente_ficha', 'relatorios', 'relatorio_novo', 'relatorio_detalhe'],
      'cuidador': ['dashboard', 'relatorios', 'relatorio_novo', 'relatorio_detalhe']
    };

    return (permissoes[sessao.perfil] || []).includes(recurso);
  },

  async cadastrarUsuario(dados) {
    const usuarios = await this.obterUsuarios();

    if (usuarios.find(u => u.email === dados.email)) {
      return { sucesso: false, erro: 'E-mail já cadastrado' };
    }

    // Validar força do código
    if (dados.codigo && dados.codigo.length < 6) {
      return { sucesso: false, erro: 'O código deve ter pelo menos 6 caracteres.' };
    }

    // Hash do código antes de salvar
    const codigoHash = dados.codigo ? await this._hashCodigo(dados.codigo) : null;

    const novoUsuario = {
      id: Utils.gerarId(),
      nome: dados.nome,
      email: dados.email,
      codigo: null,
      codigo_hash: codigoHash,
      perfil: dados.perfil,
      status: 'ativo',
      criado_em: new Date().toISOString()
    };

    if (DB.modoSupabase) {
      const { error } = await clientSupabase.from('usuarios').insert(novoUsuario);
      if (error) {
        console.error(error);
        return { sucesso: false, erro: 'Erro ao cadastrar usuário.' };
      }
    } else {
      usuarios.push(novoUsuario);
      localStorage.setItem(this.CHAVE_USUARIOS, JSON.stringify(usuarios));
    }

    // Registrar auditoria
    if (typeof Auditoria !== 'undefined') {
      Auditoria.registrar('Usuário cadastrado', 'usuarios', `${dados.nome} (${dados.perfil})`);
    }

    return { sucesso: true, codigo: dados.codigo };
  },

  async bloquearUsuario(id) {
    if (DB.modoSupabase) {
      const { error } = await clientSupabase.from('usuarios').update({ status: 'bloqueado' }).eq('id', id);
      if (error) return false;
    } else {
      const usuarios = await this.obterUsuarios();
      const idx = usuarios.findIndex(u => u.id === id);
      if (idx !== -1) {
        usuarios[idx].status = 'bloqueado';
        localStorage.setItem(this.CHAVE_USUARIOS, JSON.stringify(usuarios));
      }
    }

    const usuarios = await this.obterUsuarios();
    const usuario = usuarios.find(u => u.id === id);
    if (typeof Auditoria !== 'undefined') {
      Auditoria.registrar('Usuário bloqueado', 'usuarios', usuario ? usuario.nome : id);
    }

    return true;
  },

  async desbloquearUsuario(id) {
    if (DB.modoSupabase) {
      const { error } = await clientSupabase.from('usuarios').update({ status: 'ativo' }).eq('id', id);
      if (error) return false;
    } else {
      const usuarios = await this.obterUsuarios();
      const idx = usuarios.findIndex(u => u.id === id);
      if (idx !== -1) {
        usuarios[idx].status = 'ativo';
        localStorage.setItem(this.CHAVE_USUARIOS, JSON.stringify(usuarios));
      }
    }

    const usuarios = await this.obterUsuarios();
    const usuario = usuarios.find(u => u.id === id);
    if (typeof Auditoria !== 'undefined') {
      Auditoria.registrar('Usuário desbloqueado', 'usuarios', usuario ? usuario.nome : id);
    }

    return true;
  },

  gerarCodigo() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  },

  renderizarSidebar(paginaAtual) {
    const sessao = this.obterSessao();
    if (!sessao) return;

    const iniciais = Utils.obterIniciais(sessao.nome);
    const perfilLabel = { admin: 'Administrador', admin_master: 'Admin Master', medico: 'Médico', enfermeiro: 'Enfermeiro', tecnico_enfermagem: 'Técnico Enfermagem', assistente_social: 'Assist. Social', cuidador: 'Cuidador' };

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

          ${sessao.perfil !== 'cuidador' ? `
          <div class="nav-section">Pacientes</div>
          <a href="pacientes.html" class="${paginaAtual === 'pacientes' ? 'active' : ''}">
            <i class="fas fa-users"></i> Listar Pacientes
          </a>
          ${sessao.perfil !== 'assistente_social' ? `
          <a href="paciente-novo.html" class="${paginaAtual === 'paciente-novo' ? 'active' : ''}">
            <i class="fas fa-user-plus"></i> Novo Paciente
          </a>` : ''}
          ` : ''}

          <div class="nav-section">Relatórios</div>
          <a href="relatorios.html" class="${paginaAtual === 'relatorios' ? 'active' : ''}">
            <i class="fas fa-file-medical"></i> Relatórios
          </a>
          ${sessao.perfil !== 'assistente_social' ? `
          <a href="relatorio-novo.html" class="${paginaAtual === 'relatorio-novo' ? 'active' : ''}">
            <i class="fas fa-plus-circle"></i> Novo Relatório
          </a>` : ''}

          ${sessao.perfil === 'admin' || sessao.perfil === 'admin_master' ? `
          <div class="nav-section">Sistema</div>
          <a href="usuarios.html" class="${paginaAtual === 'usuarios' ? 'active' : ''}">
            <i class="fas fa-user-cog"></i> Gerenciar Usuários
          </a>` : ''}
          ${sessao.perfil === 'admin_master' ? `
          <a href="auditoria.html" class="${paginaAtual === 'auditoria' ? 'active' : ''}">
            <i class="fas fa-clipboard-check"></i> Auditoria
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
    Auth.registrarOnline();
  }

  // Marcar que auth.js está pronto
  window.AuthPronto = true;
});
