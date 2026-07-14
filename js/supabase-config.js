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

if (SUPABASE_URL !== 'COLE_AQUI_SEU_PROJECT_URL' && window.supabase) {
  clientSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// Verificar se Supabase está configurado
function verificarSupabase() {
  if (!clientSupabase || SUPABASE_URL === 'COLE_AQUI_SEU_PROJECT_URL') {
    return false;
  }
  return true;
}
