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
  // Extract all four inputs from the newly updated React form
  const targetOtId = formData.get('targetOtId');
  const conflictBookingId = formData.get('conflictBookingId');
  const patientId = formData.get('patientId');
  const scheduledStart = formData.get('scheduledStart');

  // Call the Supabase RPC function with all required parameters
  const { error } = await supabase.rpc('emergency_override', {
    p_conflict_booking_id: Number(conflictBookingId),
    p_new_patient_id: Number(patientId),
    p_target_ot_id: Number(targetOtId),
    p_scheduled_start: scheduledStart as string,
    p_staff_ids: [1, 2], // Hardcoded default staff arrays for the DBMS demo
    p_asset_ids: [1]     // Hardcoded default asset arrays for the DBMS demo
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Refresh the page data to show the updated database state
  revalidatePath('/');
  return { success: true };
}