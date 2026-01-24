
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIGURATION ---
// SECURITY NOTE: The 'Anon' key is a public client-side key. 
// It is designed to be exposed in the browser. 
// Real security is handled by the Row Level Security (RLS) policies in your database, not by hiding this key.

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://njiuohepwvobmjqdxqtk.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qaXVvaGVwd3ZvYm1qcWR4cXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNzA0MjcsImV4cCI6MjA4Mjc0NjQyN30.jXoz-8Q42R34CAcLQYPXwaIACRO_XcgbfjHqYjMTq3A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
