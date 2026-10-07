-- High-performance indexes for concurrent locking and fast lookups
CREATE INDEX idx_booking_ot_time   ON SURGERY_BOOKING (OT_ID, Scheduled_Start);
CREATE INDEX idx_booking_patient   ON SURGERY_BOOKING (Patient_ID);
CREATE INDEX idx_asset_branch      ON SURGICAL_ASSET (Current_Branch_ID);
CREATE INDEX idx_asset_status      ON SURGICAL_ASSET (Sterilization_Status);

-- Phase 2 Schema Refinement: Concrete time window for sterilization cooldown
ALTER TABLE SURGICAL_ASSET ADD COLUMN Available_At TIMESTAMP;