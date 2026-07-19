/* ========================================
   Sistema de Auditoria ( leve e simples )
   ======================================== */

const Auditoria = {
  async registrar(acao, modulo, detalhes = '') {
    const sessao = Auth.obterSessao();
    const registro = {
      id: Utils.gerarId(),
      usuario_id: sessao ? sessao.id : null,
      usuario_nome: sessao ? sessao.nome : 'Sistema',
      acao: acao,
      modulo: modulo,
      detalhes: detalhes,
      timestamp: new Date().toISOString()
    };

    if (DB.modoSupabase) {
      try {
        const { data, error } = await clientSupabase.from('auditoria').insert(registro);
        if (error) {
          console.error('Erro ao registrar auditoria (Supabase):', error.message || error);
        }
      } catch (e) {
        console.error('Erro ao registrar auditoria (rede):', e);
      }
    } else {
      const chave = 'auditoria_faam';
      let registros = JSON.parse(localStorage.getItem(chave) || '[]');
      registros.unshift(registro);
      if (registros.length > 200) registros = registros.slice(0, 200);
      localStorage.setItem(chave, JSON.stringify(registros));
    }
  },

  async limpar() {
    if (DB.modoSupabase) {
      try {
        const { error } = await clientSupabase.from('auditoria').delete().neq('id', '');
        if (error) throw error;
        return true;
      } catch (e) {
        console.error('Erro ao limpar auditoria:', e);
        return false;
      }
    } else {
      localStorage.removeItem('auditoria_faam');
      return true;
    }
  },

  async obterRegistros(filtro = {}) {
    if (DB.modoSupabase) {
      try {
        let query = clientSupabase
          .from('auditoria')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);

        if (filtro.usuario_id) query = query.eq('usuario_id', filtro.usuario_id);
        if (filtro.modulo) query = query.eq('modulo', filtro.modulo);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.error('Erro ao buscar auditoria:', e);
        return [];
      }
    }

    const chave = 'auditoria_faam';
    let registros = JSON.parse(localStorage.getItem(chave) || '[]');

    if (filtro.usuario_id) registros = registros.filter(r => r.usuario_id === filtro.usuario_id);
    if (filtro.modulo) registros = registros.filter(r => r.modulo === filtro.modulo);

    return registros;
  }
};
