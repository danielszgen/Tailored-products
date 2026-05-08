import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wzyqcvqmefvsamhqessx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eXFjdnFtZWZ2c2FtaHFlc3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTM2NzMsImV4cCI6MjA5MzgyOTY3M30.VLYIQgbBYaceHZYWRAvrBvU1A8kLnqVsxFP9gzOH42U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
