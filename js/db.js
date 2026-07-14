/* ========================================
   Camada de Dados (Supabase + localStorage)
   ======================================== */

const DB = {
  CHAVE_PACIENTES: 'pacientes_asilo',
  CHAVE_RELATORIOS: 'relatorios_asilo',
  modoSupabase: false,

  _sincronizando: false,

  async init() {
    this.modoSupabase = verificarSupabase();

    if (this.modoSupabase) {
      console.log('✅ Conectado ao Supabase - dados sincronizados em nuvem');
      await this._syncSeed();
    } else {
      console.log('📦 Modo offline - dados salvos no navegador');
      if (!localStorage.getItem(this.CHAVE_PACIENTES)) {
        this._seedLocal();
      }
    }
  },

  async _syncSeed() {
    if (this._sincronizando) return;
    this._sincronizando = true;

    try {
      // Criar usuários iniciais (admin padrão)
      await Auth.criarUsuariosIniciais();
    } finally {
      this._sincronizando = false;
    }
  },

  async limparTodosPacientes() {
    if (!this.modoSupabase) {
      localStorage.removeItem(this.CHAVE_PACIENTES);
      localStorage.removeItem(this.CHAVE_RELATORIOS);
      return;
    }
    await clientSupabase.from('relatorios').delete().neq('id', '');
    await clientSupabase.from('pacientes').delete().neq('id', '');
  },

  _seedLocal() {
    localStorage.setItem(this.CHAVE_PACIENTES, JSON.stringify(DadosIniciais.pacientes));
    localStorage.setItem(this.CHAVE_RELATORIOS, JSON.stringify(DadosIniciais.relatorios));
  },

  // ===== PACIENTES =====
  async obterPacientes() {
    if (this.modoSupabase) {
      const { data, error } = await clientSupabase.from('pacientes').select('*');
      if (error) { console.error(error); return []; }
      return data || [];
    }
    const dados = localStorage.getItem(this.CHAVE_PACIENTES);
    return dados ? JSON.parse(dados) : [];
  },

  async salvarPacientes(pacientes) {
    if (this.modoSupabase) {
      // Não usado diretamente, operações são individuais
      return;
    }
    localStorage.setItem(this.CHAVE_PACIENTES, JSON.stringify(pacientes));
  },

  async obterPacientePorId(id) {
    if (this.modoSupabase) {
      const { data, error } = await clientSupabase.from('pacientes').select('*').eq('id', id).single();
      if (error) { console.error(error); return null; }
      return data;
    }
    return (await this.obterPacientes()).find(p => p.id === id);
  },

  async cadastrarPaciente(dados) {
    const paciente = {
      id: Utils.gerarId(),
      ...dados,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };

    if (this.modoSupabase) {
      const { error } = await clientSupabase.from('pacientes').insert(paciente);
      if (error) { console.error(error); Utils.mostrarToast('Erro ao salvar.', 'error'); return null; }
    } else {
      const pacientes = await this.obterPacientes();
      pacientes.push(paciente);
      this.salvarPacientes(pacientes);
    }
    return paciente;
  },

  async editarPaciente(id, dados) {
    dados.atualizado_em = new Date().toISOString();

    if (this.modoSupabase) {
      const { error } = await clientSupabase.from('pacientes').update(dados).eq('id', id);
      if (error) { console.error(error); Utils.mostrarToast('Erro ao atualizar.', 'error'); return null; }
    } else {
      const pacientes = await this.obterPacientes();
      const idx = pacientes.findIndex(p => p.id === id);
      if (idx === -1) return null;
      pacientes[idx] = { ...pacientes[idx], ...dados };
      this.salvarPacientes(pacientes);
    }
    return await this.obterPacientePorId(id);
  },

  async excluirPaciente(id) {
    if (this.modoSupabase) {
      await clientSupabase.from('relatorios').delete().eq('paciente_id', id);
      const { error } = await clientSupabase.from('pacientes').delete().eq('id', id);
      if (error) { console.error(error); return false; }
    } else {
      const pacientes = (await this.obterPacientes()).filter(p => p.id !== id);
      this.salvarPacientes(pacientes);
      const relatorios = (await this.obterRelatorios()).filter(r => r.paciente_id !== id);
      localStorage.setItem(this.CHAVE_RELATORIOS, JSON.stringify(relatorios));
    }
    return true;
  },

  async buscarPacientes(termo, filtros = {}) {
    let pacientes = await this.obterPacientes();

    if (termo) {
      const t = termo.toLowerCase();
      pacientes = pacientes.filter(p =>
        (p.nome && p.nome.toLowerCase().includes(t)) ||
        (p.cpf && p.cpf.replace(/\D/g, '').includes(t.replace(/\D/g, ''))) ||
        (p.quarto && p.quarto.toLowerCase().includes(t))
      );
    }

    if (filtros.status) pacientes = pacientes.filter(p => p.status === filtros.status);
    if (filtros.sexo) pacientes = pacientes.filter(p => p.sexo === filtros.sexo);
    if (filtros.quarto) pacientes = pacientes.filter(p => p.quarto && p.quarto.toLowerCase().includes(filtros.quarto.toLowerCase()));
    if (filtros.idadeMin) pacientes = pacientes.filter(p => Utils.calcularIdade(p.data_nascimento) >= parseInt(filtros.idadeMin));
    if (filtros.idadeMax) pacientes = pacientes.filter(p => Utils.calcularIdade(p.data_nascimento) <= parseInt(filtros.idadeMax));

    return pacientes;
  },

  // ===== RELATÓRIOS =====
  async obterRelatorios() {
    if (this.modoSupabase) {
      const { data, error } = await clientSupabase.from('relatorios').select('*');
      if (error) { console.error(error); return []; }
      return data || [];
    }
    const dados = localStorage.getItem(this.CHAVE_RELATORIOS);
    return dados ? JSON.parse(dados) : [];
  },

  async salvarRelatorios(relatorios) {
    if (this.modoSupabase) return;
    localStorage.setItem(this.CHAVE_RELATORIOS, JSON.stringify(relatorios));
  },

  async obterRelatorioPorId(id) {
    if (this.modoSupabase) {
      const { data, error } = await clientSupabase.from('relatorios').select('*').eq('id', id).single();
      if (error) { console.error(error); return null; }
      return data;
    }
    return (await this.obterRelatorios()).find(r => r.id === id);
  },

  async obterRelatoriosPorPaciente(pacienteId) {
    if (this.modoSupabase) {
      const { data, error } = await clientSupabase.from('relatorios')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('criado_em', { ascending: false });
      if (error) { console.error(error); return []; }
      return data || [];
    }
    return (await this.obterRelatorios())
      .filter(r => r.paciente_id === pacienteId)
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  },

  async cadastrarRelatorio(dados) {
    const relatorio = {
      id: Utils.gerarId(),
      ...dados,
      criado_em: new Date().toISOString()
    };

    if (this.modoSupabase) {
      const { error } = await clientSupabase.from('relatorios').insert(relatorio);
      if (error) { console.error(error); Utils.mostrarToast('Erro ao salvar.', 'error'); return null; }
    } else {
      const relatorios = await this.obterRelatorios();
      relatorios.push(relatorio);
      this.salvarRelatorios(relatorios);
    }
    return relatorio;
  },

  async excluirRelatorio(id) {
    if (this.modoSupabase) {
      await clientSupabase.from('relatorios').delete().eq('id', id);
    } else {
      const relatorios = (await this.obterRelatorios()).filter(r => r.id !== id);
      this.salvarRelatorios(relatorios);
    }
  },

  async buscarRelatorios(termo, filtros = {}) {
    let relatorios = await this.obterRelatorios();
    const pacientes = await this.obterPacientes();

    relatorios = relatorios.map(r => {
      const paciente = pacientes.find(p => p.id === r.paciente_id);
      return { ...r, paciente_nome: paciente ? paciente.nome : 'Desconhecido' };
    });

    if (termo) {
      const t = termo.toLowerCase();
      relatorios = relatorios.filter(r =>
        r.paciente_nome.toLowerCase().includes(t) ||
        (r.profissional && r.profissional.toLowerCase().includes(t))
      );
    }

    if (filtros.tipo) relatorios = relatorios.filter(r => r.tipo === filtros.tipo);
    if (filtros.paciente_id) relatorios = relatorios.filter(r => r.paciente_id === filtros.paciente_id);

    return relatorios.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  },

  // ===== ESTATÍSTICAS =====
  async obterEstatisticas() {
    const pacientes = await this.obterPacientes();
    const relatorios = await this.obterRelatorios();

    const ativos = pacientes.filter(p => p.status === 'ativo').length;
    const altas = pacientes.filter(p => p.status === 'alta').length;
    const obitos = pacientes.filter(p => p.status === 'obito').length;
    const total = pacientes.length;

    const comControlados = pacientes.filter(p =>
      p.medicamentos && p.medicamentos.toLowerCase().includes('controlado')
    ).length;

    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    const relatoriosRecentes = relatorios.filter(r => new Date(r.criado_em) >= semanaAtras).length;

    const masculino = pacientes.filter(p => p.sexo === 'M').length;
    const feminino = pacientes.filter(p => p.sexo === 'F').length;

    const faixas = { '0-59': 0, '60-69': 0, '70-79': 0, '80-89': 0, '90+': 0 };
    pacientes.forEach(p => {
      const idade = Utils.calcularIdade(p.data_nascimento);
      if (idade < 60) faixas['0-59']++;
      else if (idade < 70) faixas['60-69']++;
      else if (idade < 80) faixas['70-79']++;
      else if (idade < 90) faixas['80-89']++;
      else faixas['90+']++;
    });

    const ultimosRelatorios = relatorios
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
      .slice(0, 5)
      .map(r => {
        const paciente = pacientes.find(p => p.id === r.paciente_id);
        return { ...r, paciente_nome: paciente ? paciente.nome : 'Desconhecido' };
      });

    return { total, ativos, altas, obitos, comControlados, relatoriosRecentes, masculino, feminino, faixas, ultimosRelatorios };
  },

  async resetarDados() {
    await this.limparTodosPacientes();
  }
};
