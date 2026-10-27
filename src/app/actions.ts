'use server'

import { supabase } from './lib/supabase';
import { revalidatePath } from 'next/cache';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pull every `name[]` multi-value field out of FormData into a string array. */
function getAll(formData: FormData, name: string): string[] {
  return formData.getAll(name).map((v) => String(v).trim()).filter(Boolean);
}

// ─── Action 1: Book Surgery ────────────────────────────────────────────────────
//
// Executes a 3-step workflow against the normalized schema:
//   Step 1 → INSERT into surgery_booking, capture booking_id
//   Step 2 → INSERT rows into booking_staff_assignment (one per staff member)
//   Step 3 → INSERT rows into booking_asset_allocation (one per asset)
//
export async function bookSurgery(formData: FormData) {
  // ── Parse core fields ────────────────────────────────────────────────────────
  const patientId      = Number(formData.get('patientId'));
  const otId           = Number(formData.get('otId'));
  const scheduledStart = String(formData.get('scheduledStart'));

  if (!patientId || !otId || !scheduledStart) {
    return { success: false, error: 'Patient ID, OT ID, and Scheduled Start are required.' };
  }

  // ── Parse staff arrays ───────────────────────────────────────────────────────
  const rawStaffIds   = getAll(formData, 'staffId');
  const rawStaffRoles = getAll(formData, 'staffRole');
  const staffIds      = rawStaffIds.map(Number).filter((n) => !isNaN(n) && n > 0);
  const staffRoles    = rawStaffRoles.slice(0, staffIds.length);

  // ── Parse asset arrays ───────────────────────────────────────────────────────
  const rawAssetIds = getAll(formData, 'assetId');
  const assetIds    = rawAssetIds.map(Number).filter((n) => !isNaN(n) && n > 0);

  // ── Step 1: Insert the primary booking record ──────────────────────────────
  const { data: booking, error: bookingError } = await supabase
    .from('surgery_booking')
    .insert({
      patient_id:       patientId,
      ot_id:            otId,
      scheduled_start:  new Date(scheduledStart).toISOString(),
      booking_status:   'Scheduled',
    })
    .select('booking_id')
    .single();

  if (bookingError || !booking) {
    return {
      success: false,
      error: bookingError?.message ?? 'Failed to create surgery booking.',
    };
  }

  const bookingId = booking.booking_id;

  // ── Step 2: Insert staff assignments ──────────────────────────────────────
  if (staffIds.length > 0) {
    const staffRows = staffIds.map((staffId, i) => ({
      booking_id:    bookingId,
      staff_id:      staffId,
      assigned_role: staffRoles[i] ?? 'Unspecified',
    }));

    const { error: staffError } = await supabase
      .from('booking_staff_assignment')
      .insert(staffRows);

    if (staffError) {
      // Booking was created — surface the error but still revalidate so the
      // partial record appears in the feed with a clear signal.
      return {
        success: false,
        error: `Booking #${bookingId} created but staff assignment failed: ${staffError.message}`,
      };
    }
  }

  // ── Step 3: Insert asset allocations ──────────────────────────────────────
  if (assetIds.length > 0) {
    const allocationStart = new Date(scheduledStart).toISOString();

    const assetRows = assetIds.map((assetId) => ({
      booking_id:       bookingId,
      asset_id:         assetId,
      allocation_start: allocationStart,
    }));

    const { error: assetError } = await supabase
      .from('booking_asset_allocation')
      .insert(assetRows);

    if (assetError) {
      return {
        success: false,
        error: `Booking #${bookingId} created but asset allocation failed: ${assetError.message}`,
      };
    }
  }

  revalidatePath('/');
  return { success: true, bookingId };
}

// ─── Action 2: Trigger Emergency Override ──────────────────────────────────────
//
// Executes a 4-step workflow:
//   Step 1 → Bump the conflicting booking to 'Rescheduled'
//   Step 2 → INSERT the emergency booking into surgery_booking
//   Step 3 → INSERT staff assignments
//   Step 4 → INSERT asset allocations
//
export async function triggerEmergency(formData: FormData) {
  const targetOtId        = Number(formData.get('targetOtId'));
  const conflictBookingId = Number(formData.get('conflictBookingId'));
  const patientId         = Number(formData.get('patientId'));
  const scheduledStart    = String(formData.get('scheduledStart'));

  if (!targetOtId || !conflictBookingId || !patientId || !scheduledStart) {
    return { success: false, error: 'All emergency fields are required.' };
  }

  // ── Parse optional staff/asset overrides ────────────────────────────────────
  const rawStaffIds   = getAll(formData, 'staffId');
  const rawStaffRoles = getAll(formData, 'staffRole');
  const staffIds      = rawStaffIds.map(Number).filter((n) => !isNaN(n) && n > 0);
  const staffRoles    = rawStaffRoles.slice(0, staffIds.length);

  const rawAssetIds = getAll(formData, 'assetId');
  const assetIds    = rawAssetIds.map(Number).filter((n) => !isNaN(n) && n > 0);

  // ── Step 1: Bump the conflicting booking to 'Rescheduled' ─────────────────
  const { error: rescheduleError } = await supabase
    .from('surgery_booking')
    .update({ booking_status: 'Rescheduled' })
    .eq('booking_id', conflictBookingId);

  if (rescheduleError) {
    return {
      success: false,
      error: `Could not reschedule conflict booking #${conflictBookingId}: ${rescheduleError.message}`,
    };
  }

  // ── Step 2: Insert the emergency booking record ────────────────────────────
  const { data: emergencyBooking, error: bookingError } = await supabase
    .from('surgery_booking')
    .insert({
      patient_id:      patientId,
      ot_id:           targetOtId,
      scheduled_start: new Date(scheduledStart).toISOString(),
      booking_status:  'Emergency',
    })
    .select('booking_id')
    .single();

  if (bookingError || !emergencyBooking) {
    return {
      success: false,
      error: bookingError?.message ?? 'Failed to create emergency booking.',
    };
  }

  const emergencyBookingId = emergencyBooking.booking_id;

  // ── Step 3: Insert staff assignments (if provided) ────────────────────────
  if (staffIds.length > 0) {
    const staffRows = staffIds.map((staffId, i) => ({
      booking_id:    emergencyBookingId,
      staff_id:      staffId,
      assigned_role: staffRoles[i] ?? 'Emergency Responder',
    }));

    const { error: staffError } = await supabase
      .from('booking_staff_assignment')
      .insert(staffRows);

    if (staffError) {
      return {
        success: false,
        error: `Emergency booking #${emergencyBookingId} created but staff assignment failed: ${staffError.message}`,
      };
    }
  }

  // ── Step 4: Insert asset allocations (if provided) ────────────────────────
  if (assetIds.length > 0) {
    const allocationStart = new Date(scheduledStart).toISOString();

    const assetRows = assetIds.map((assetId) => ({
      booking_id:       emergencyBookingId,
      asset_id:         assetId,
      allocation_start: allocationStart,
    }));

    const { error: assetError } = await supabase
      .from('booking_asset_allocation')
      .insert(assetRows);

    if (assetError) {
      return {
        success: false,
        error: `Emergency booking #${emergencyBookingId} created but asset allocation failed: ${assetError.message}`,
      };
    }
  }

  revalidatePath('/');
  return { success: true, bookingId: emergencyBookingId };
}
