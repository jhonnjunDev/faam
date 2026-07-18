// Cloudflare Worker para upload de arquivos no R2
// Deploy: wrangler deploy
// Configuração: wrangler.toml com R2 bucket binding

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Upload de arquivo
    if (url.pathname === '/upload' && request.method === 'POST') {
      return handleUpload(request, env, corsHeaders);
    }

    // Listar documentos de um paciente
    if (url.pathname === '/list' && request.method === 'GET') {
      return handleList(request, env, corsHeaders);
    }

    // Deletar documento
    if (url.pathname === '/delete' && request.method === 'DELETE') {
      return handleDelete(request, env, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};

async function handleUpload(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const pacienteId = formData.get('paciente_id');
    const nome = formData.get('nome');
    const tipo = formData.get('tipo');
    const tamanho = formData.get('tamanho');

    if (!file || !pacienteId) {
      return new Response(JSON.stringify({ error: 'Arquivo e paciente_id são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gerar chave única
    const extensao = nome.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const key = `${pacienteId}/${timestamp}-${random}.${extensao}`;

    // Upload para R2
    await env.DOCUMENTOS.put(key, file, {
      httpMetadata: { contentType: tipo },
    });

    // Gerar URL pública (se bucket for público) ou URL assinada
    const url = `https://faam-upload.jhonjunn.workers.dev/file/${key}`;

    return new Response(JSON.stringify({ url, key, nome, tipo, tamanho }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleList(request, env, corsHeaders) {
  const url = new URL(request.url);
  const pacienteId = url.searchParams.get('paciente_id');

  if (!pacienteId) {
    return new Response(JSON.stringify({ error: 'paciente_id é obrigatório' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const listed = await env.DOCUMENTOS.list({ prefix: `${pacienteId}/` });
  const objects = listed.objects.map((obj) => ({
    key: obj.key,
    nome: obj.key.split('/').pop(),
    tamanho: obj.size,
    criado_em: obj.uploaded,
  }));

  return new Response(JSON.stringify(objects), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleDelete(request, env, corsHeaders) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({ error: 'key é obrigatório' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await env.DOCUMENTOS.delete(key);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
