/* ========================================
   Configuração do Supabase
   ========================================
   SEGURANÇA: Esta chave é pública (anon key) e segura no client-side
   SOMENTE se o RLS (Row Level Security) estiver habilitado no Supabase.
   Execute o supabase-setup.sql para configurar as políticas de acesso.
   ======================================== */

const SUPABASE_URL = 'https://htfhfutjhlqktbzjbiuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZmhmdXRqaGxxa3RiempiaXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODQzNDQsImV4cCI6MjA5OTQ2MDM0NH0.j9fyx9LyndY2ltnyPAdVoByNa8JIynCwtOVp5A-BycI';

// Inicializar cliente Supabase (usando nome diferente para evitar conflito)
let clientSupabase = null;

function inicializarSupabase() {
  if (SUPABASE_URL === 'COLE_AQUI_SEU_PROJECT_URL') return false;
  
  // Tentar criar cliente Supabase
  if (window.supabase && window.supabase.createClient) {
    clientSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    return true;
  }
  
  // Se window.supabase ainda não existe, tentar novamente em 200ms
  if (!clientSupabase) {
    setTimeout(inicializarSupabase, 200);
  }
  return false;
}

// Tentar inicializar imediatamente
inicializarSupabase();

// Verificar se Supabase está configurado
function verificarSupabase() {
  if (SUPABASE_URL === 'COLE_AQUI_SEU_PROJECT_URL') {
    return false;
  }
  // Se o cliente ainda não foi criado, tentar inicializar
  if (!clientSupabase) {
    // Se o CDN já carregou, criar cliente diretamente
    if (window.supabase && window.supabase.createClient) {
      clientSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    } else {
      inicializarSupabase();
    }
  }
  return !!clientSupabase;
}

// Aguardar Supabase estar pronto (chamado por DB.init)
function aguardarSupabase(timeoutMs = 3000) {
  return new Promise((resolve) => {
    if (verificarSupabase()) {
      resolve(true);
      return;
    }
    const start = Date.now();
    const check = () => {
      if (verificarSupabase()) {
        resolve(true);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(check, 100);
    };
    setTimeout(check, 100);
  });
}
