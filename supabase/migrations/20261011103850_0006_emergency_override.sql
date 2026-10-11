CREATE OR REPLACE FUNCTION emergency_override(
  p_patient_id INT,
  p_ot_id INT,
  p_start TIMESTAMP,
  p_duration INTERVAL,
  p_staff_ids INT[],
  p_staff_roles VARCHAR[],
  p_asset_ids INT[],
  p_conflict_booking_id INT
) RETURNS INT AS $$
DECLARE
  v_new_booking_id INT;
BEGIN
  -- 1. Terminate the conflicting scheduled surgery
  IF p_conflict_booking_id IS NOT NULL THEN
    UPDATE SURGERY_BOOKING
    SET Booking_Status = 'Cancelled - Emergency Override'
    WHERE Booking_ID = p_conflict_booking_id;
  END IF;

  -- 2. Force the new emergency booking into the OT
  INSERT INTO SURGERY_BOOKING (Patient_ID, OT_ID, Scheduled_Start, Booking_Status)
  VALUES (p_patient_id, p_ot_id, p_start, 'Emergency')
  RETURNING Booking_ID INTO v_new_booking_id;

  -- 3. Allocate staff and assets to the emergency
  INSERT INTO BOOKING_STAFF_ASSIGNMENT (Booking_ID, Staff_ID, Assigned_Role)
  SELECT v_new_booking_id, s, r FROM UNNEST(p_staff_ids, p_staff_roles) AS t(s, r);

  INSERT INTO BOOKING_ASSET_ALLOCATION (Booking_ID, Asset_ID, Allocation_Start)
  SELECT v_new_booking_id, a, p_start FROM UNNEST(p_asset_ids) AS a;

  RETURN v_new_booking_id;
END;
$$ LANGUAGE plpgsql;