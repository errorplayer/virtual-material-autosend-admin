import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database'; 

// 从环境变量读取密钥（本地和 Vercel 都能生效）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 加个校验，避免密钥为空
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);