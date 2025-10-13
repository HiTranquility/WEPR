import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://bsquccixwwxlflkvijkb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXVjY2l4d3d4bGZsa3ZpamtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzc1ODEsImV4cCI6MjA3NTkxMzU4MX0.lwZgGDIATG3azMQRHKC3IbdXJ9CqycUdOTnJreWT8vo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
