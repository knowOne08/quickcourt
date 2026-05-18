// frontend/src/pages/user/BookingPage.js
import React from 'react';
import { useParams } from 'react-router-dom';
import BookingForm from '../../components/booking/BookingForm';
import { FiCalendar, FiActivity, FiShield } from 'react-icons/fi';

const BookingPage = () => {
  const { venueId } = useParams();

  const handleBookingSuccess = (booking) => {
    console.log('Operational synchronization successful:', booking);
  };

  return (
    <div className="min-h-screen bg-white py-24 px-6 md:px-12 font-inter relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-screen bg-primary opacity-[0.02] -skew-x-12 translate-x-1/2" />
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-20 space-y-6 max-w-3xl animate-fade-in">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] italic">
            <FiCalendar /> RESERVATION STAGING
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">SECURE YOUR <br/><span className="text-primary underline decoration-primary/10">COURT</span></h1>
          <p className="text-xl text-gray-400 font-medium italic leading-relaxed">Initiate operational deployment by selecting your preferred temporal window and arena sector.</p>
        </header>
        
        <div className="bg-white rounded-[60px] shadow-premium border border-gray-100 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -skew-x-12 translate-x-1/2" />
          <div className="p-1">
            <BookingForm 
              venueId={venueId} 
              onSuccess={handleBookingSuccess}
            />
          </div>
        </div>

        <footer className="mt-16 flex flex-wrap gap-8 opacity-40">
          <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
            <FiShield className="text-primary" /> SECURE TRANSMISSION
          </div>
          <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
            <FiActivity className="text-primary" /> REAL-TIME AVAILABILITY
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BookingPage;
