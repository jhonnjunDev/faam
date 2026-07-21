/* ========================================
   Utilitários Gerais
   ======================================== */

const Utils = {
  formatarCPF(cpf) {
    if (!cpf) return '-';
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  formatarTelefone(tel) {
    if (!tel) return '-';
    tel = tel.replace(/\D/g, '');
    if (tel.length === 11) return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (tel.length === 10) return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return tel;
  },

  formatarData(data) {
    if (!data) return '-';
    const d = new Date(data + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  },

  formatarDataHora(data) {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  },

  calcularIdade(dataNascimento) {
    if (!dataNascimento) return '-';
    const hoje = new Date();
    const nasc = new Date(dataNascimento + 'T00:00:00');
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const mes = hoje.getMonth() - nasc.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  },

  gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  async hashSenha(senha) {
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  sanitizar(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Sanitizar dados antes de enviar ao Supabase (remove scripts e tags perigosas)
  sanitizarDados(dados) {
    const sanitizado = {};
    for (const [chave, valor] of Object.entries(dados)) {
      if (typeof valor === 'string') {
        // Remove tags HTML e scripts
        sanitizado[chave] = valor
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/on\w+="[^"]*"/gi, '')
          .replace(/on\w+='[^']*'/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/data:/gi, '')
          .trim();
      } else {
        sanitizado[chave] = valor;
      }
    }
    return sanitizado;
  },

  // Validar email
  validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Validar CPF
  validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === parseInt(cpf[10]);
  },

  truncar(str, max) {
    if (!str || str.length <= max) return str || '';
    return str.substring(0, max) + '...';
  },

  obterIniciais(nome) {
    if (!nome) return '??';
    return nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  },

  escapeHtml(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, m => map[m]);
  },

  statusBadge(status) {
    const map = {
      'ativo': 'badge-ativo',
      'alta': 'badge-alta',
      'obito': 'badge-obito'
    };
    const cls = map[status] || 'badge-tipo';
    const label = status === 'obito' ? 'Óbito' : status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="badge ${cls}"><i class="fas fa-circle" style="font-size:6px"></i> ${label}</span>`;
  },

  tipoRelatorioBadge(tipo) {
    const cores = {
      'evolucao': 'background:#ebf8ff;color:#2b6cb0',
      'enfermagem': 'background:#f0fff4;color:#276749',
      'prescricao': 'background:#faf5ff;color:#6b46c1',
      'nutricional': 'background:#f0fff4;color:#276749',
      'laudo': 'background:#fffff0;color:#975a16',
      'alta': 'background:#e6fffa;color:#234e52',
      'obito': 'background:#fff5f5;color:#9b2c2c'
    };
    const labels = {
      'evolucao': 'Evolução Clínica',
      'enfermagem': 'Enfermagem',
      'prescricao': 'Prescrição Médica',
      'nutricional': 'Nutricional',
      'laudo': 'Laudos',
      'alta': 'Relatório de Alta',
      'obito': 'Relatório de Óbito'
    };
    const style = cores[tipo] || 'background:#edf2f7;color:#2d3748';
    return `<span class="badge badge-tipo" style="${style}">${labels[tipo] || tipo}</span>`;
  },

  obterParametroUrl(nome) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nome);
  },

  confirmar(mensagem) {
    return confirm(mensagem);
  },

  mostrarToast(mensagem, tipo = 'success') {
    const toast = document.createElement('div');
    const cores = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' };
    const icones = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: ${cores[tipo] || cores.info};
      color: #fff; padding: 16px 28px; border-radius: 12px;
      font-size: 15px; font-weight: 600; box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      display: flex; align-items: center; gap: 10px;
      animation: toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      transition: opacity 0.3s, transform 0.3s;
    `;
    toast.innerHTML = `<i class="fas ${icones[tipo] || icones.info}"></i> ${mensagem}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};
