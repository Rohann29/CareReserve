'use server';

import { createClient } from '@/utils/supabase/server';

export async function loginUser(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { error: true, message: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: true, message: error.message };
  }

  return { success: true };
}
