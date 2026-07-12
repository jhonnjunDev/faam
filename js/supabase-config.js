/* ========================================
   Configuração do Supabase
   ======================================== */

const SUPABASE_URL = 'https://htfhfutjhlqktzbziuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZmhmdXRqaGxxa3RiempiaXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODQzNDQsImV4cCI6MjA5OTQ2MDM0NH0.j9fyx9LyndY2ltnyPAdVoByNa8JIynCwtOVp5A-BycI';

// Inicializar cliente Supabase (usando nome diferente para evitar conflito)
let clientSupabase = null;

if (SUPABASE_URL !== 'COLE_AQUI_SEU_PROJECT_URL' && window.supabase) {
  clientSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase configurado!');
}

// Verificar se Supabase está configurado
function verificarSupabase() {
  if (!clientSupabase || SUPABASE_URL === 'COLE_AQUI_SEU_PROJECT_URL') {
    console.warn('⚠️ Supabase não configurado. Usando modo offline.');
    return false;
  }
  return true;
}
