import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import ActionPanels from './components/ActionPanels';

export const revalidate = 0; 

export default async function Dashboard() {
  // 1. Fetch Hospital Branches
  const { data: branches, error: branchError } = await supabase
    .from('hospital_branch')
    .select('*')
    .order('branch_id', { ascending: true });

  // 2. Fetch Active Reserved OTs from Rohan's surgery_booking table
  const { data: reservedOts, error: otError } = await supabase
    .from('surgery_booking')
    .select('*')
    .in('Booking_Status', ['Scheduled', 'Emergency'])
    .order('Scheduled_Start', { ascending: true })
    .limit(6);

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto bg-stone-50 font-sans text-stone-800">
      <Toaster position="top-right" />
      
      <header className="mb-8 border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-stone-800">CareReserve Admin Dashboard</h1>
        <p className="text-stone-500 font-medium mt-1">Live Resource Allocation Engine</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Hospital Branches Overview */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-100 bg-white/50">
            <h2 className="font-semibold text-stone-800 text-lg">Hospital Branches Overview</h2>
          </div>
          
          {branchError ? (
            <div className="p-6 text-rose-600 bg-rose-50">
              Failed to connect to database: {branchError.message}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-600">
                <thead className="bg-stone-50/80 text-stone-500 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Branch ID</th>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">City</th>
                    <th className="px-6 py-4 font-medium">Emergency Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {branches?.map((branch) => (
                    <tr key={branch.branch_id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-teal-700">#{branch.branch_id}</td>
                      <td className="px-6 py-4 font-medium text-stone-800">{branch.branch_name}</td>
                      <td className="px-6 py-4">{branch.location_city}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full font-medium bg-teal-50 text-teal-700 text-xs border border-teal-100">
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

        {/* Right Side: Live Reserved OTs Feed */}
        <section className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
            <h2 className="font-semibold text-stone-800 text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Live Reserved OTs
            </h2>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            {otError ? (
              <div className="text-sm text-rose-600 p-3 bg-rose-50 rounded-lg border border-rose-100 text-center font-medium">
                Error: {otError.message}
              </div>
            ) : !reservedOts || reservedOts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-stone-400 text-sm py-12">
                No active reservations.
              </div>
            ) : (
              <ul className="space-y-3">
                {reservedOts.map((ot: { Booking_ID: number, OT_ID: number, Booking_Status: string, Patient_ID: number, Scheduled_Start: string }) => (
                  <li key={ot.Booking_ID} className="p-4 rounded-xl border border-stone-100 bg-stone-50/50 hover:border-teal-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-stone-800 text-sm">OT #{ot.OT_ID}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                        ot.Booking_Status === 'Emergency' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ot.Booking_Status}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 flex justify-between items-center mt-1">
                      <span>Patient #{ot.Patient_ID}</span>
                      <span className="font-medium bg-white px-2 py-1 rounded border border-stone-200">
                        {new Date(ot.Scheduled_Start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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