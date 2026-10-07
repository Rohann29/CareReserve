CREATE OR REPLACE FUNCTION book_surgery(
  p_patient_id INT,
  p_ot_id INT,
  p_start TIMESTAMP,
  p_duration INTERVAL,
  p_staff_ids INT[],
  p_staff_roles VARCHAR[],
  p_asset_ids INT[]
) RETURNS INT AS $$
DECLARE
  v_booking_id INT;
  v_conflict INT;
  v_asset RECORD;
BEGIN
  -- Lock the OT row so no other transaction can book it concurrently
  PERFORM 1 FROM OPERATING_THEATER WHERE OT_ID = p_ot_id FOR UPDATE;

  -- Check for overlapping bookings on this OT (still inside the lock)
  SELECT Booking_ID INTO v_conflict
  FROM SURGERY_BOOKING
  WHERE OT_ID = p_ot_id
    AND Booking_Status IN ('Scheduled','Active')
    AND (Scheduled_Start, Scheduled_Start + p_duration) OVERLAPS (p_start, p_start + p_duration)
  LIMIT 1;

  IF v_conflict IS NOT NULL THEN
    RAISE EXCEPTION 'OT % already booked (Booking_ID %) for this time window', p_ot_id, v_conflict;
  END IF;

  -- Lock and validate every requested asset before committing to anything
  FOR v_asset IN
    SELECT * FROM SURGICAL_ASSET WHERE Asset_ID = ANY(p_asset_ids) FOR UPDATE
  LOOP
    IF v_asset.Sterilization_Status <> 'Ready' THEN
      RAISE EXCEPTION 'Asset % is not Ready (status: %)', v_asset.Asset_ID, v_asset.Sterilization_Status;
    END IF;
  END LOOP;

  -- All checks passed — commit the booking as one atomic unit
  INSERT INTO SURGERY_BOOKING (Patient_ID, OT_ID, Scheduled_Start, Booking_Status)
  VALUES (p_patient_id, p_ot_id, p_start, 'Scheduled')
  RETURNING Booking_ID INTO v_booking_id;

  INSERT INTO BOOKING_STAFF_ASSIGNMENT (Booking_ID, Staff_ID, Assigned_Role)
  SELECT v_booking_id, s, r FROM UNNEST(p_staff_ids, p_staff_roles) AS t(s, r);

  INSERT INTO BOOKING_ASSET_ALLOCATION (Booking_ID, Asset_ID, Allocation_Start)
  SELECT v_booking_id, a, p_start FROM UNNEST(p_asset_ids) AS a;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;