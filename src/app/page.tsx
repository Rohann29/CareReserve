import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import ActionPanels from './components/ActionPanels';

export const revalidate = 0; 

export default async function Dashboard() {
  const { data: branches, error: branchError } = await supabase
    .from('hospital_branch')
    .select('*')
    .order('branch_id', { ascending: true });

  const { data: reservedOts, error: otError } = await supabase
    .from('surgery_booking')
    .select('*')
    .in('booking_status', ['Scheduled', 'Emergency'])
    .order('scheduled_start', { ascending: true })
    .limit(6);

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-[1400px] mx-auto bg-stone-200/50 font-sans text-stone-800">
      <Toaster position="top-right" />
      
      {/* Bento Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Header Compartment */}
        <header className="lg:col-span-3 bg-teal-900 text-white rounded-[2rem] p-8 md:p-10 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">CareReserve Dashboard</h1>
            <p className="text-teal-100/80 font-medium text-lg">Live Resource Allocation Engine</p>
          </div>
          {/* Subtle aesthetic background shape */}
          <div className="absolute -right-10 -top-20 w-80 h-80 bg-teal-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        </header>

        {/* 2. Branches Compartment */}
        <section className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-stone-50">
            <h2 className="font-bold text-stone-800 text-xl">Hospital Branches</h2>
          </div>
          
          {branchError ? (
            <div className="p-8 text-rose-600 bg-rose-50 flex-1">
              Error: {branchError.message}
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 p-2">
              <table className="w-full text-left text-sm text-stone-600">
                <thead className="text-stone-400 uppercase tracking-wider text-xs">
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

        {/* 3. Live OTs Compartment */}
        <section className="lg:col-span-1 bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-stone-50 bg-gradient-to-br from-stone-50/50 to-white">
            <h2 className="font-bold text-stone-800 text-xl flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
              Active OTs
            </h2>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto bg-stone-50/30">
            {otError ? (
              <div className="text-sm text-rose-600 p-4 bg-rose-50 rounded-2xl border border-rose-100 font-medium">
                Error: {otError.message}
              </div>
            ) : !reservedOts || reservedOts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-stone-400 text-sm py-12">
                No active reservations.
              </div>
            ) : (
              <ul className="space-y-4">
                {reservedOts.map((ot: { booking_id: number, ot_id: number, booking_status: string, patient_id: number, scheduled_start: string }) => (
                  <li key={ot.booking_id} className="p-5 rounded-2xl border border-stone-100 bg-white shadow-sm hover:border-teal-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-stone-800">OT #{ot.ot_id}</span>
                      <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg ${
                        ot.booking_status === 'Emergency' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ot.booking_status}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 flex justify-between items-center">
                      <span className="font-medium bg-stone-100 px-2.5 py-1.5 rounded-lg">Pt. #{ot.patient_id}</span>
                      <span className="font-semibold text-stone-600">
                        {new Date(ot.scheduled_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

      </div>

      <ActionPanels /> 
    </main>
  );
}