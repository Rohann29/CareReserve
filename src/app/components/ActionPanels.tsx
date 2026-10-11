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
      {/* Booking Form */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800">Schedule New Surgery</h2>
        </div>
        <form ref={bookingFormRef} onSubmit={handleBooking} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
            <input type="number" name="patientId" placeholder="e.g. 1042" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operating Theater (OT) ID</label>
            <input type="number" name="otId" placeholder="e.g. 3" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Start</label>
            <input type="datetime-local" name="scheduledStart" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors mt-2">
            Book Surgery
          </button>
        </form>
      </section>

      {/* Emergency Override */}
      <section className="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200 bg-red-100">
          <h2 className="font-semibold text-red-800 flex items-center gap-2">⚠️ Emergency Override</h2>
        </div>
        <form ref={emergencyFormRef} onSubmit={handleEmergency} className="p-6 space-y-4">
          <p className="text-sm text-red-700 mb-4">
            Warning: Executing this action will instantly bump an existing elective booking to {"'Rescheduled'"} status to free up the target OT.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-red-800 mb-1">Target OT ID</label>
            <input type="number" name="targetOtId" placeholder="e.g. 3" className="w-full border border-red-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-red-800 mb-1">Old Surgery to Bump (Conflict ID)</label>
            <input type="number" name="conflictBookingId" placeholder="e.g. 502" className="w-full border border-red-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-red-800 mb-1">Emergency Patient ID</label>
            <input type="number" name="patientId" placeholder="e.g. 911" className="w-full border border-red-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-red-800 mb-1">Emergency Scheduled Start</label>
            <input type="datetime-local" name="scheduledStart" className="w-full border border-red-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" required />
          </div>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors mt-4">
            Initiate Override Cascade
          </button>
        </form>
      </section>
    </div>
  );
}