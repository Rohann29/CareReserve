'use client'

import { toast } from 'react-hot-toast';
import { bookSurgery, triggerEmergency } from '../actions';
import { useRef, useState, useTransition } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
type StaffRow = { id: string; staffId: string; role: string };
type AssetRow = { id: string; assetId: string };

const ROLE_OPTIONS = [
  'Lead Surgeon',
  'Anesthesiologist',
  'Scrub Nurse',
  'Surgical Technologist',
  'Perfusionist',
  'Assistant Surgeon',
];

// ── Utility ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);

// ── Shared class tokens ────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-stone-100 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300 transition-all';

const labelCls = 'block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-0.5';

const addBtnCls =
  'inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 border border-teal-200 hover:border-teal-400 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-all';

const removeBtnCls =
  'shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition-colors text-base leading-none border border-transparent hover:border-rose-200';

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Thin horizontal rule with a label — separates form sections cleanly */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="h-px flex-1 bg-stone-100" />
      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-stone-100" />
    </div>
  );
}

/** Single staff row: Staff ID number input + role dropdown + optional remove */
function StaffRowInput({
  row,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: {
  row: StaffRow;
  index: number;
  canRemove: boolean;
  onUpdate: (id: string, field: keyof Omit<StaffRow, 'id'>, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 items-start">
      <input
        type="number"
        name="staffId"
        placeholder={`Staff ID ${index + 1}`}
        value={row.staffId}
        onChange={(e) => onUpdate(row.id, 'staffId', e.target.value)}
        className="w-28 bg-stone-100 border border-transparent rounded-xl px-3 py-3 text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300 transition-all tabular-nums"
        min={1}
        aria-label={`Staff ID ${index + 1}`}
      />
      <select
        name="staffRole"
        value={row.role}
        onChange={(e) => onUpdate(row.id, 'role', e.target.value)}
        className="flex-1 bg-stone-100 border border-transparent rounded-xl px-3 py-3 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300 transition-all appearance-none cursor-pointer"
        aria-label={`Role for staff ${index + 1}`}
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(row.id)}
          className={removeBtnCls}
          aria-label="Remove staff member"
        >
          ×
        </button>
      )}
    </div>
  );
}

/** Single asset row: Asset ID number input + optional remove */
function AssetRowInput({
  row,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: {
  row: AssetRow;
  index: number;
  canRemove: boolean;
  onUpdate: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="number"
        name="assetId"
        placeholder={`Asset ID ${index + 1}`}
        value={row.assetId}
        onChange={(e) => onUpdate(row.id, e.target.value)}
        className="flex-1 bg-stone-100 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300 transition-all tabular-nums"
        min={1}
        aria-label={`Asset ID ${index + 1}`}
      />
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(row.id)}
          className={removeBtnCls}
          aria-label="Remove asset"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ActionPanels() {
  const bookingFormRef   = useRef<HTMLFormElement>(null);
  const emergencyFormRef = useRef<HTMLFormElement>(null);

  const [isBookingPending, startBookingTransition]     = useTransition();
  const [isEmergencyPending, startEmergencyTransition] = useTransition();

  // Booking form: start with 2 staff rows and 1 asset row
  const [staffRows, setStaffRows] = useState<StaffRow[]>([
    { id: uid(), staffId: '', role: 'Lead Surgeon' },
    { id: uid(), staffId: '', role: 'Anesthesiologist' },
  ]);
  const [assetRows, setAssetRows] = useState<AssetRow[]>([
    { id: uid(), assetId: '' },
  ]);

  // ── Booking handler ──────────────────────────────────────────────────────────
  function handleBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startBookingTransition(async () => {
      toast.loading('Booking surgery...', { id: 'booking' });
      const result = await bookSurgery(formData);

      if (!result.success) {
        toast.error(`Blocked: ${result.error}`, { id: 'booking' });
      } else {
        toast.success(`Surgery booked — ID #${result.bookingId}`, { id: 'booking' });
        bookingFormRef.current?.reset();
        setStaffRows([
          { id: uid(), staffId: '', role: 'Lead Surgeon' },
          { id: uid(), staffId: '', role: 'Anesthesiologist' },
        ]);
        setAssetRows([{ id: uid(), assetId: '' }]);
      }
    });
  }

  // ── Emergency handler ────────────────────────────────────────────────────────
  function handleEmergency(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startEmergencyTransition(async () => {
      toast.loading('Initiating override...', { id: 'emergency' });
      const result = await triggerEmergency(formData);

      if (!result.success) {
        toast.error(`Failed: ${result.error}`, { id: 'emergency' });
      } else {
        toast.success(`Emergency override active — Booking #${result.bookingId}`, { id: 'emergency' });
        emergencyFormRef.current?.reset();
      }
    });
  }

  // ── Staff row helpers ────────────────────────────────────────────────────────
  const addStaffRow = () =>
    setStaffRows((r) => [...r, { id: uid(), staffId: '', role: 'Lead Surgeon' }]);
  const removeStaffRow = (id: string) =>
    setStaffRows((r) => r.filter((row) => row.id !== id));
  const updateStaff = (id: string, field: keyof Omit<StaffRow, 'id'>, value: string) =>
    setStaffRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  // ── Asset row helpers ────────────────────────────────────────────────────────
  const addAssetRow = () =>
    setAssetRows((r) => [...r, { id: uid(), assetId: '' }]);
  const removeAssetRow = (id: string) =>
    setAssetRows((r) => r.filter((row) => row.id !== id));
  const updateAsset = (id: string, value: string) =>
    setAssetRows((r) => r.map((row) => (row.id === id ? { ...row, assetId: value } : row)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

      {/* ════════════════ Schedule Surgery ════════════════ */}
      <section className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col">

        {/* Panel header */}
        <div className="px-8 py-5 border-b border-stone-100 bg-stone-50/60 shrink-0">
          <h2 className="font-bold text-stone-800 text-lg">Schedule Surgery</h2>
          <p className="text-xs text-stone-400 mt-0.5">Create a new booking with staff and equipment allocation.</p>
        </div>

        <form ref={bookingFormRef} onSubmit={handleBooking} className="p-8 space-y-5 flex-1">

          {/* ── Core booking fields ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Patient ID</label>
              <input type="number" name="patientId" placeholder="e.g. 1042" className={inputCls} required min={1} />
            </div>
            <div>
              <label className={labelCls}>OT ID</label>
              <input type="number" name="otId" placeholder="e.g. 3" className={inputCls} required min={1} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Scheduled Start</label>
            <input type="datetime-local" name="scheduledStart" className={inputCls} required />
          </div>

          {/* ── Staff Assignment Section ──────────────────────────────────── */}
          <SectionDivider label="Staff Assignment" />

          <div className="bg-stone-50/70 border border-stone-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Assign Team Members
              </p>
              <button type="button" onClick={addStaffRow} className={addBtnCls}>
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
                </svg>
                Add Staff
              </button>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[7rem_1fr] gap-2 px-0.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Staff ID</span>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Role</span>
            </div>

            {staffRows.map((row, idx) => (
              <StaffRowInput
                key={row.id}
                row={row}
                index={idx}
                canRemove={staffRows.length > 1}
                onUpdate={updateStaff}
                onRemove={removeStaffRow}
              />
            ))}
          </div>

          {/* ── Surgical Asset Section ────────────────────────────────────── */}
          <SectionDivider label="Equipment Allocation" />

          <div className="bg-stone-50/70 border border-stone-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Allocate Surgical Assets
              </p>
              <button type="button" onClick={addAssetRow} className={addBtnCls}>
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
                </svg>
                Add Asset
              </button>
            </div>

            {assetRows.map((row, idx) => (
              <AssetRowInput
                key={row.id}
                row={row}
                index={idx}
                canRemove={assetRows.length > 1}
                onUpdate={updateAsset}
                onRemove={removeAssetRow}
              />
            ))}
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isBookingPending}
            className="w-full bg-teal-800 hover:bg-teal-900 disabled:bg-teal-800/60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-2xl transition-all text-sm tracking-wide mt-1"
          >
            {isBookingPending ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </section>

      {/* ════════════════ Emergency Override ════════════════ */}
      <section className="bg-white rounded-[2rem] shadow-sm border border-rose-100 overflow-hidden flex flex-col">

        {/* Panel header */}
        <div className="px-8 py-5 border-b border-rose-100 bg-rose-50/40 shrink-0">
          <h2 className="font-bold text-rose-900 text-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
            Emergency Override
          </h2>
          <p className="text-xs text-rose-400 mt-0.5">Bump an elective booking to free the target OT immediately.</p>
        </div>

        <form ref={emergencyFormRef} onSubmit={handleEmergency} className="p-8 space-y-5 flex-1">

          {/* Info callout */}
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
            <p className="text-xs font-medium text-rose-700 leading-relaxed">
              This action sets the conflict booking to <strong>Rescheduled</strong> and
              inserts a new <strong>Emergency</strong> booking in its place. This cannot be undone from this panel.
            </p>
          </div>

          {/* ── Core fields ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-rose-700/70 uppercase tracking-wider mb-1.5 ml-0.5">
                Target OT
              </label>
              <input
                type="number"
                name="targetOtId"
                placeholder="e.g. 3"
                className="w-full bg-stone-100 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-300 transition-all"
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-rose-700/70 uppercase tracking-wider mb-1.5 ml-0.5">
                Conflict Booking ID
              </label>
              <input
                type="number"
                name="conflictBookingId"
                placeholder="e.g. 502"
                className="w-full bg-stone-100 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-300 transition-all"
                required
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-700/70 uppercase tracking-wider mb-1.5 ml-0.5">
              Emergency Patient ID
            </label>
            <input
              type="number"
              name="patientId"
              placeholder="e.g. 911"
              className="w-full bg-stone-100 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-300 transition-all"
              required
              min={1}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-700/70 uppercase tracking-wider mb-1.5 ml-0.5">
              Emergency Scheduled Start
            </label>
            <input
              type="datetime-local"
              name="scheduledStart"
              className="w-full bg-stone-100 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-300 transition-all"
              required
            />
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isEmergencyPending}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-2xl transition-all text-sm tracking-wide mt-auto"
          >
            {isEmergencyPending ? 'Initiating...' : 'Initiate Override Cascade'}
          </button>
        </form>
      </section>

    </div>
  );
}
