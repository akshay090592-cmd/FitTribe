import { createClient } from '@supabase/supabase-js';

// Access environment variables safely for Vite
// Vite uses import.meta.env and requires variables to be prefixed with VITE_

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL && !process.env.SUPABASE_URL) {
  console.warn('Supabase URL is missing. Check your .env file or Netlify settings and ensure keys start with VITE_');
}

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY;
  return !!url && !!key && !url.includes('placeholder');
};

export const supabase = createClient(supabaseUrl, supabaseKey);