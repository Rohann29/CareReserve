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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      
      {/* 4. Schedule Compartment */}
      <section className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-stone-50 bg-teal-50/30">
          <h2 className="font-bold text-teal-900 text-xl">Schedule Surgery</h2>
        </div>
        <form ref={bookingFormRef} onSubmit={handleBooking} className="p-8 space-y-6 flex-1">
          <div>
            <label className="block text-sm font-bold text-stone-600 mb-2 ml-1">Patient ID</label>
            <input type="number" name="patientId" placeholder="e.g. 1042" className="w-full border-none bg-stone-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-teal-500/30 outline-none transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-600 mb-2 ml-1">Operating Theater (OT) ID</label>
            <input type="number" name="otId" placeholder="e.g. 3" className="w-full border-none bg-stone-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-teal-500/30 outline-none transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-600 mb-2 ml-1">Scheduled Start</label>
            <input type="datetime-local" name="scheduledStart" className="w-full border-none bg-stone-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-teal-500/30 outline-none transition-all" required />
          </div>
          <button type="submit" className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-4 px-6 rounded-2xl transition-all mt-6">
            Book Surgery
          </button>
        </form>
      </section>

      {/* 5. Emergency Compartment */}
      <section className="bg-[#FFFDFB] rounded-[2rem] shadow-sm border border-rose-100 overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-rose-50 bg-rose-50/30">
          <h2 className="font-bold text-rose-900 text-xl flex items-center gap-2">⚠️ Emergency Override</h2>
        </div>
        <form ref={emergencyFormRef} onSubmit={handleEmergency} className="p-8 space-y-5 flex-1">
          <p className="text-sm font-medium text-rose-700/80 mb-6 leading-relaxed bg-rose-50 p-4 rounded-2xl border border-rose-100/50">
            Executing this action will instantly bump an existing elective booking to {"'Rescheduled'"} status to free up the target OT.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-rose-800 mb-2 ml-1">Target OT</label>
              <input type="number" name="targetOtId" placeholder="e.g. 3" className="w-full border-none bg-stone-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-400/30 outline-none transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-rose-800 mb-2 ml-1">Conflict ID</label>
              <input type="number" name="conflictBookingId" placeholder="e.g. 502" className="w-full border-none bg-stone-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-400/30 outline-none transition-all" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-rose-800 mb-2 ml-1">Emergency Patient ID</label>
            <input type="number" name="patientId" placeholder="e.g. 911" className="w-full border-none bg-stone-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-400/30 outline-none transition-all" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-rose-800 mb-2 ml-1">Emergency Scheduled Start</label>
            <input type="datetime-local" name="scheduledStart" className="w-full border-none bg-stone-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-400/30 outline-none transition-all" required />
          </div>

          <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-6 rounded-2xl shadow-sm transition-all mt-4">
            Initiate Override Cascade
          </button>
        </form>
      </section>

    </div>
  );
}