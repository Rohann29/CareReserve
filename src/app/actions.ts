'use server'

import { supabase } from './lib/supabase';
import { revalidatePath } from 'next/cache';

// Action 1: Book Surgery
export async function bookSurgery(formData: FormData) {
  const patientId = formData.get('patientId');
  const otId = formData.get('otId');
  const scheduledStart = formData.get('scheduledStart');

  const { error } = await supabase.rpc('book_surgery', {
    p_patient_id: parseInt(patientId as string),
    p_ot_id: parseInt(otId as string),
    p_start: scheduledStart,
    p_duration: '02:00:00', 
    p_staff_ids: [1, 2],    
    p_staff_roles: ['Lead Surgeon', 'Anesthesiologist'],
    p_asset_ids: [1]        
  });

  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/'); 
  return { success: true };
}

// Action 2: Trigger Emergency
export async function triggerEmergency(formData: FormData) {
  const targetOtId = formData.get('targetOtId');

  // Assuming Rohan named the parameter p_target_ot_id (update if different in his SQL)
  const { error } = await supabase.rpc('emergency_override', {
    p_target_ot_id: parseInt(targetOtId as string)
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}