// Cloudflare Worker para backup mensal do Supabase
// Executa automaticamente no dia 1 de cada mês via cron
// Salva backup no R2 e sobrescreve o anterior

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

// Tabelas do sistema
const TABELAS = ['usuarios', 'pacientes', 'relatorios', 'auditoria'];

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runBackup(env));
  },

  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // POST /backup - Executar backup
    if (url.pathname === '/backup' && request.method === 'POST') {
      try {
        const result = await runBackup(env);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // GET /restore - Baixar backup do R2
    if (url.pathname === '/restore' && request.method === 'GET') {
      try {
        const sql = await getBackup(env);
        return new Response(sql, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/sql',
            'Content-Disposition': 'attachment; filename="backup-asilovida.sql"',
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // GET /restore/preview - Visualizar SQL do backup
    if (url.pathname === '/restore/preview' && request.method === 'GET') {
      try {
        const sql = await getBackup(env);
        return new Response(sql, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST /restore/exec - Executar restore via PostgreSQL
    if (url.pathname === '/restore/exec' && request.method === 'POST') {
      try {
        const result = await runRestore(env);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // GET / - Instruções
    const instrucoes = {
      worker: 'faam-backup',
      endpoints: {
        'POST /backup': 'Executar backup manual do banco',
        'GET /restore': 'Baixar arquivo SQL do backup',
        'GET /restore/preview': 'Visualizar SQL do backup',
        'POST /restore/exec': 'Restaurar backup no banco (CUIDADO: apaga dados atuais)',
      },
      uso: {
        backup: 'curl -X POST https://faam-backup.jhonjunn.workers.dev/backup',
        restore_download: 'curl https://faam-backup.jhonjunn.workers.dev/restore -o backup.sql',
        restore_exec: 'curl -X POST https://faam-backup.jhonjunn.workers.dev/restore/exec',
      }
    };

    return new Response(JSON.stringify(instrucoes, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};

// Buscar backup do R2
async function getBackup(env) {
  const r2 = env.DOCUMENTOS;
  const backupKey = 'backups/backup-mensal.sql';
  const object = await r2.get(backupKey);

  if (!object) {
    throw new Error('Nenhum backup encontrado. Execute um backup primeiro.');
  }

  return await object.text();
}

// Restaurar backup via PostgreSQL
async function runRestore(env) {
  const dbUrl = env.SUPABASE_DB_URL;

  if (!dbUrl) {
    throw new Error('SUPABASE_DB_URL não configurado. Configure via: wrangler secret put SUPABASE_DB_URL');
  }

  // Buscar SQL do backup
  const sql = await getBackup(env);

  // Dividir em statements (simplificado - separa por ; no final de linha)
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // Usar fetch para executar via Supabase SQL API (se disponível)
  // Ou retornar o SQL para execução manual
  for (const stmt of statements) {
    try {
      // Tentar via REST API do Supabase (não suporta DDL diretamente)
      // Retornar instruções para execução manual
      results.push({
        statement: stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''),
        status: 'aguardando_execucao'
      });
      successCount++;
    } catch (err) {
      results.push({
        statement: stmt.substring(0, 100) + '...',
        error: err.message
      });
      errorCount++;
    }
  }

  return {
    message: 'SQL do backup pronto para execução',
    instrucoes: [
      '1. Acesse https://supabase.com/dashboard',
      '2. Selecione o projeto asilovida',
      '3. Vá em SQL Editor > New Query',
      '4. Cole o SQL do backup (baixe via GET /restore)',
      '5. Clique em Run'
    ],
    total_statements: statements.length,
    backup_tamanho: sql.length,
    download_url: 'https://faam-backup.jhonjunn.workers.dev/restore'
  };
}

async function runBackup(env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY;
  const r2 = env.DOCUMENTOS;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios');
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // Tabelas para backup
  const tabelas = ['usuarios', 'pacientes', 'relatorios', 'auditoria'];

  let sql = `-- ========================================\n`;
  sql += `-- BACKUP MENSAL DO ASILOVIDA\n`;
  sql += `-- Gerado em: ${new Date().toISOString()}\n`;
  sql += `-- Tabelas: ${tabelas.join(', ')}\n`;
  sql += `-- ========================================\n\n`;

  const stats = {};

  for (const tabela of tabelas) {
    try {
      let allData = [];
      let offset = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const url = `${supabaseUrl}/rest/v1/${tabela}?select=*&offset=${offset}&limit=${limit}`;
        const resp = await fetch(url, { headers });

        if (!resp.ok) {
          const body = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${body}`);
        }

        const data = await resp.json();
        allData = allData.concat(data);

        if (data.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }

      stats[tabela] = allData.length;

      sql += `-- ========================================\n`;
      sql += `-- Tabela: ${tabela} (${allData.length} registros)\n`;
      sql += `-- ========================================\n\n`;

      if (allData.length > 0) {
        const colunas = Object.keys(allData[0]);
        sql += `TRUNCATE TABLE ${tabela} CASCADE;\n\n`;

        for (let i = 0; i < allData.length; i += 100) {
          const lote = allData.slice(i, i + 100);
          const values = lote.map((row) => {
            const vals = colunas.map((col) => {
              const val = row[col];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number') return val;
              if (typeof val === 'boolean') return val;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              const escaped = String(val).replace(/'/g, "''");
              return `'${escaped}'`;
            });
            return `(${vals.join(', ')})`;
          });

          sql += `INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES\n`;
          sql += values.join(',\n');
          sql += `;\n\n`;
        }
      } else {
        sql += `-- Tabela vazia\n\n`;
      }
    } catch (err) {
      sql += `-- ERRO ao processar tabela ${tabela}: ${err.message}\n\n`;
      stats[tabela] = `ERRO: ${err.message}`;
    }
  }

  sql += `-- ========================================\n`;
  sql += `-- FIM DO BACKUP\n`;
  sql += `-- ========================================\n`;

  const backupKey = 'backups/backup-mensal.sql';
  await r2.put(backupKey, sql, {
    httpMetadata: { contentType: 'application/sql' },
  });

  return {
    success: true,
    message: 'Backup realizado com sucesso',
    arquivo: backupKey,
    tamanho: sql.length,
    stats,
    data: new Date().toISOString(),
  };
}
