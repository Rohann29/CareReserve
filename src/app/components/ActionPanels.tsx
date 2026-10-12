'use client'

import { toast } from 'react-hot-toast';
import { bookSurgery, triggerEmergency } from '../actions';
import { useRef } from 'react';

export default function ActionPanels() {
  const bookingFormRef = useRef<HTMLFormElement>(null);
  const emergencyFormRef = useRef<HTMLFormElement>(null);

  async function handleBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); 
    const formData = new FormData(e.currentTarget);
    
    toast.loading('Booking surgery...', { id: 'booking' });
    const result = await bookSurgery(formData);
    
    if (result.error) {
      toast.error(`Blocked: ${result.error}`, { id: 'booking' });
    } else {
      toast.success('Surgery successfully booked!', { id: 'booking' });
      bookingFormRef.current?.reset();
    }
  }

  async function handleEmergency(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); 
    const formData = new FormData(e.currentTarget);

    toast.loading('Initiating override...', { id: 'emergency' });
    const result = await triggerEmergency(formData);
    
    if (result.error) {
      toast.error(`Failed: ${result.error}`, { id: 'emergency' });
    } else {
      toast.success('Emergency override successful.', { id: 'emergency' });
      emergencyFormRef.current?.reset();
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      
      {/* Schedule Form - Vibrant & Aesthetic Teal */}
      <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100 bg-gradient-to-r from-teal-50/50 to-white">
          <h2 className="font-semibold text-teal-800 text-lg">Schedule New Surgery</h2>
        </div>
        <form ref={bookingFormRef} onSubmit={handleBooking} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Patient ID</label>
            <input type="number" name="patientId" placeholder="e.g. 1042" className="w-full border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-stone-50/50" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Operating Theater (OT) ID</label>
            <input type="number" name="otId" placeholder="e.g. 3" className="w-full border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-stone-50/50" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Scheduled Start</label>
            <input type="datetime-local" name="scheduledStart" className="w-full border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-stone-50/50" required />
          </div>
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm shadow-teal-600/20 transition-all mt-4">
            Book Surgery
          </button>
        </form>
      </section>

      {/* Emergency Form - Warm & Less Loud Rose */}
      <section className="bg-[#FFFDFB] rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-rose-100 bg-rose-50/50">
          <h2 className="font-semibold text-rose-800 text-lg flex items-center gap-2">⚠️ Emergency Override</h2>
        </div>
        <form ref={emergencyFormRef} onSubmit={handleEmergency} className="p-6 space-y-4">
          <p className="text-sm text-rose-600/80 mb-5 leading-relaxed bg-rose-50/80 p-3 rounded-lg border border-rose-100/50">
            Warning: Executing this action will instantly bump an existing elective booking to {"'Rescheduled'"} status to free up the target OT.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-rose-800 mb-1.5">Target OT ID</label>
            <input type="number" name="targetOtId" placeholder="e.g. 3" className="w-full border border-rose-200 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-rose-800 mb-1.5">Old Surgery to Bump (Conflict ID)</label>
            <input type="number" name="conflictBookingId" placeholder="e.g. 502" className="w-full border border-rose-200 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-rose-800 mb-1.5">Emergency Patient ID</label>
            <input type="number" name="patientId" placeholder="e.g. 911" className="w-full border border-rose-200 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-rose-800 mb-1.5">Emergency Scheduled Start</label>
            <input type="datetime-local" name="scheduledStart" className="w-full border border-rose-200 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all" required />
          </div>

          <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm shadow-rose-600/20 transition-all mt-6">
            Initiate Override Cascade
          </button>
        </form>
      </section>

    </div>
  );
}