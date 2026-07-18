// Configuração do Cloudflare R2
// O bucket deve ser criado no dashboard do Cloudflare: https://dash.cloudflare.com
// Habilitar "S3 API" no bucket para funcionar via navegador

const R2_CONFIG = {
  accountId: '269f3bad584cd7e4ac3f5b4318b0a04a',
  bucketName: 'faam-documentos', // Nome do bucket no R2
  publicAccess: false, // Não usar acesso público - usar URLs assinados ou Worker proxy
};

const R2 = {
  // Upload de arquivo para R2 via Cloudflare Worker (proxy)
  // O Worker recebe o arquivo e salva no R2
  async upload(pacienteId, arquivo) {
    const formData = new FormData();
    formData.append('file', arquivo);
    formData.append('paciente_id', pacienteId);
    formData.append('nome', arquivo.name);
    formData.append('tipo', arquivo.type);
    formData.append('tamanho', arquivo.size.toString());

    const response = await fetch('https://faam-upload.jhonjunn.workers.dev/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const erro = await response.text();
      throw new Error(`Erro no upload: ${erro}`);
    }

    const resultado = await response.json();
    return resultado; // { url, path }
  },

  // Gerar nome único para o arquivo
  gerarNomeArquivo(pacienteId, nomeOriginal) {
    const extensao = nomeOriginal.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${pacienteId}/${timestamp}-${random}.${extensao}`;
  },

  // Converter bytes para formato legível
  formatarTamanho(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const tamanhos = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i];
  },

  // Validar arquivo antes do upload
  validarArquivo(arquivo) {
    const maximo = 10 * 1024 * 1024; // 10MB
    const permitidos = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (arquivo.size > maximo) {
      throw new Error(`Arquivo muito grande. Máximo: 10MB. Tamanho: ${this.formatarTamanho(arquivo.size)}`);
    }

    if (!permitidos.includes(arquivo.type)) {
      throw new Error('Tipo de arquivo não permitido. Use: PDF, JPG, PNG, WebP ou DOC/DOCX');
    }

    return true;
  }
};
