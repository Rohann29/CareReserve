import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import ActionPanels from './components/ActionPanels';

export const revalidate = 0; 

export default async function Dashboard() {
  const { data: branches, error } = await supabase
    .from('hospital_branch')
    .select('*')
    .order('branch_id', { ascending: true });

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <Toaster position="top-right" /> {/* This enables the pop-up notifications */}
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CareReserve Admin Dashboard</h1>
        <p className="text-gray-500">Live Resource Allocation Engine</p>
      </header>

      {/* Branch Overview Table */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800">Hospital Branches Overview</h2>
        </div>
        
        {error ? (
          <div className="p-6 text-red-600 bg-red-50">
            Failed to connect to database: {error.message}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Branch ID</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">City</th>
                  <th className="px-6 py-3 font-medium">Emergency Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {branches?.map((branch) => (
                  <tr key={branch.branch_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{branch.branch_id}</td>
                    <td className="px-6 py-4">{branch.branch_name}</td>
                    <td className="px-6 py-4">{branch.location_city}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                        {branch.emergency_capacity} beds
                      </span>
                    </td>
                  </tr>
                ))}
                {(!branches || branches.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No branches found in the live database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* The forms we just extracted into a Client Component */}
      <ActionPanels /> 
    </main>
  );
}