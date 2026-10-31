import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import ActionPanels from './components/ActionPanels';

export const revalidate = 0;

// ── Types ──────────────────────────────────────────────────────────────────────
type StaffAssignment = { staff_id: number; assigned_role: string };
type AssetAllocation = { asset_id: number; allocation_start: string };

export type StaffMember = {
  staff_id:     number;
  first_name:   string;
  last_name:    string;
  medical_role: string;
};

type Booking = {
  booking_id:               number;
  ot_id:                    number;
  patient_id:               number;
  scheduled_start:          string;
  booking_status:           string;
  booking_staff_assignment: StaffAssignment[];
  booking_asset_allocation: AssetAllocation[];
};

// ── Role abbreviation map for compact badge display ───────────────────────────
const ROLE_ABBR: Record<string, string> = {
  'Lead Surgeon':          'Lead Surg.',
  'Anesthesiologist':      'Anesth.',
  'Scrub Nurse':           'Scrub Nurse',
  'Surgical Technologist': 'Surg. Tech.',
  'Perfusionist':          'Perfusionist',
  'Assistant Surgeon':     'Asst. Surg.',
  'Emergency Responder':   'Emerg.',
  'Surgeon':               'Surgeon',
  'Unspecified':           'Unspecified',
};

function roleAbbr(role: string): string {
  return ROLE_ABBR[role] ?? role;
}

export default async function Dashboard() {
  const { data: branches, error: branchError } = await supabase
    .from('hospital_branch')
    .select('*')
    .order('branch_id', { ascending: true });

  // Fetch the full staff roster for the role-filtered dropdowns in the form
  const { data: staffList } = await supabase
    .from('staff')
    .select('staff_id, first_name, last_name, medical_role')
    .order('last_name', { ascending: true });

  // Fetch UPCOMING bookings only (scheduled_start >= now) with junction-table data
  const now = new Date().toISOString();
  const { data: reservedOts, error: otError } = await supabase
    .from('surgery_booking')
    .select(`
      booking_id,
      ot_id,
      patient_id,
      scheduled_start,
      booking_status,
      booking_staff_assignment ( staff_id, assigned_role ),
      booking_asset_allocation ( asset_id, allocation_start )
    `)
    .in('booking_status', ['Scheduled', 'Emergency'])
    .gte('scheduled_start', now)
    .order('scheduled_start', { ascending: true });

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-[1400px] mx-auto bg-stone-200/50 font-sans text-stone-800">
      <Toaster position="top-right" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Header ── */}
        <header className="lg:col-span-3 bg-teal-900 text-white rounded-[2rem] p-8 md:p-10 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">CareReserve Dashboard</h1>
            <p className="text-teal-100/80 font-medium text-lg">Live Resource Allocation Engine</p>
          </div>
          {/* Subtle depth — no garish glow */}
          <div className="absolute -right-10 -top-20 w-80 h-80 bg-teal-800 rounded-full opacity-30 pointer-events-none" />
        </header>

        {/* ── Hospital Branches ── */}
        <section className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-stone-100 flex flex-col lg:h-[420px] overflow-hidden">
          <div className="px-8 py-6 border-b border-stone-50 shrink-0">
            <h2 className="font-bold text-stone-800 text-xl">Hospital Branches</h2>
          </div>

          {branchError ? (
            <div className="p-8 text-rose-600 bg-rose-50 flex-1">
              Error: {branchError.message}
            </div>
          ) : (
            <div className="overflow-auto flex-1 p-2">
              <table className="w-full text-left text-sm text-stone-600">
                <thead className="text-stone-400 uppercase tracking-wider text-xs sticky top-0 bg-white">
                  <tr>
                    <th className="px-6 py-4 font-medium">Branch ID</th>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">City</th>
                    <th className="px-6 py-4 font-medium">Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {branches?.map((branch) => (
                    <tr key={branch.branch_id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-5 font-bold text-teal-700">#{branch.branch_id}</td>
                      <td className="px-6 py-5 font-semibold text-stone-800">{branch.branch_name}</td>
                      <td className="px-6 py-5">{branch.location_city}</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl font-bold bg-teal-50 text-teal-700 text-xs">
                          {branch.emergency_capacity} beds
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Active OTs Feed ── */}
        <section className="lg:col-span-1 bg-white rounded-[2rem] shadow-sm border border-stone-100 flex flex-col lg:h-[420px] overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-100 shrink-0 flex items-center justify-between">
            <h2 className="font-bold text-stone-800 text-xl flex items-center gap-2.5">
              {/* Amber pulse dot — plain, no glow shadow */}
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              Active OTs
            </h2>
            {reservedOts && reservedOts.length > 0 && (
              <span className="text-[11px] font-bold text-stone-400 tabular-nums">
                {reservedOts.length} active
              </span>
            )}
          </div>

          <div className="p-4 flex-1 overflow-y-auto bg-stone-50/40 space-y-3">
            {otError ? (
              <div className="text-sm text-rose-600 p-4 bg-rose-50 rounded-2xl border border-rose-100 font-medium">
                Error: {otError.message}
              </div>
            ) : !reservedOts || reservedOts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-stone-400 text-sm py-12">
                No active reservations.
              </div>
            ) : (
              (reservedOts as Booking[]).map((ot) => (
                <article
                  key={ot.booking_id}
                  className="p-4 rounded-2xl border border-stone-100 bg-white hover:border-stone-200 transition-colors"
                >
                  {/* ── Row 1: OT ID + status badge ── */}
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800 text-sm">OT #{ot.ot_id}</span>
                      <span className="text-stone-300 text-xs">·</span>
                      <span className="text-[10px] font-semibold text-stone-500 tabular-nums">
                        #{ot.booking_id}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-black tracking-wide px-2 py-0.5 rounded-md ${
                        ot.booking_status === 'Emergency'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {ot.booking_status}
                    </span>
                  </div>

                  {/* ── Row 2: Patient + time ── */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-semibold bg-stone-100 text-stone-600 px-2 py-1 rounded-lg">
                      Pt. #{ot.patient_id}
                    </span>
                    <span className="text-[11px] font-medium text-stone-500 tabular-nums">
                      {new Date(ot.scheduled_start).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* ── Row 3: Staff badges ── */}
                  {ot.booking_staff_assignment?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {ot.booking_staff_assignment.map((s) => (
                        <span
                          key={s.staff_id}
                          title={`Staff #${s.staff_id} — ${s.assigned_role}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded-md"
                        >
                          {/* Person icon */}
                          <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6a5 5 0 0 1 10 0H3Z" />
                          </svg>
                          <span>#{s.staff_id}</span>
                          <span className="text-teal-500 font-normal">
                            {roleAbbr(s.assigned_role)}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ── Row 4: Asset badges ── */}
                  {ot.booking_asset_allocation?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ot.booking_asset_allocation.map((a) => (
                        <span
                          key={a.asset_id}
                          title={`Asset #${a.asset_id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-stone-100 text-stone-500 border border-stone-200 px-1.5 py-0.5 rounded-md"
                        >
                          {/* Box icon */}
                          <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9ZM8 5a.75.75 0 0 0-.75.75v1.5H5.75a.75.75 0 0 0 0 1.5h1.5v1.5a.75.75 0 0 0 1.5 0v-1.5h1.5a.75.75 0 0 0 0-1.5H8.75v-1.5A.75.75 0 0 0 8 5Z" />
                          </svg>
                          Asset #{a.asset_id}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* No allocations fallback */}
                  {ot.booking_staff_assignment?.length === 0 &&
                   ot.booking_asset_allocation?.length === 0 && (
                    <p className="text-[10px] text-stone-400 italic mt-1">
                      No staff or assets assigned.
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

      </div>

      <ActionPanels staffList={(staffList ?? []) as StaffMember[]} />
    </main>
  );
}
