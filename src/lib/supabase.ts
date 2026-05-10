import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vsrkrmvgogougzychnyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcmtybXZnb2dvdWd6eWNobnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzY5MjQsImV4cCI6MjA5Mzg1MjkyNH0.WyXWyndWpVwuV9r-NXqYzdKZ9BOgJXZHfw_WYkPk_68';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
