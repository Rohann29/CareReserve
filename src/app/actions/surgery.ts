'use server';

import { createClient } from '@/utils/supabase/server';

type SurgeryBookingData = {
  Patient_ID: number;
  OT_ID: number;
  Scheduled_Start: string | Date;
  Staff_IDs: number[];
  Asset_IDs: number[];
};

const bookingErrorMessage = 'OT is already booked or unavailable.';

export async function handleSurgeryBooking(data: SurgeryBookingData) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('book_surgery', {
      p_patient_id: data.Patient_ID,
  p_ot_id: data.OT_ID,
  p_start: data.Scheduled_Start instanceof Date
    ? data.Scheduled_Start.toISOString()
    : data.Scheduled_Start,
  p_staff_ids: data.Staff_IDs,
  p_asset_ids: data.Asset_IDs,
  p_conflict_booking_id: data.Conflict_Booking_ID
    });

    if (error) {
      return {
        success: false,
        message: error.message || bookingErrorMessage,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error && error.message
        ? error.message
        : bookingErrorMessage,
    };
  }

  return {
    success: true,
    message: 'Surgery booked successfully.',
  };
}
