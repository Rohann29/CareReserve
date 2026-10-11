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
  const conflictBookingId = formData.get('conflictBookingId');
  const patientId = formData.get('patientId');
  const scheduledStart = formData.get('scheduledStart');

  // Exact match to Rohan's database signature
  const { error } = await supabase.rpc('emergency_override', {
    p_patient_id: Number(patientId),
    p_ot_id: Number(targetOtId),
    p_start: new Date(scheduledStart as string).toISOString(),
    p_duration: '2 hours',                           // Added missing field
    p_staff_ids: [1, 2],
    p_staff_roles: ['Surgeon', 'Anesthesiologist'],  // Added missing field
    p_asset_ids: [1],
    p_conflict_booking_id: Number(conflictBookingId)
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}