// frontend/src/components/venue/VenueModal.js
import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/ownerService';
import { FiX, FiInfo, FiMapPin, FiActivity, FiClock, FiDollarSign, FiPhone, FiMail, FiGlobe, FiShield, FiCheck, FiCamera, FiBox, FiLayers, FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const VenueModal = ({ venue, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: { address: '', city: '', state: '', country: 'India', pincode: '' },
    sports: [],
    venueType: '',
    amenities: [],
    availability: { openTime: '', closeTime: '', weeklyOff: [] },
    pricing: { hourly: '', currency: 'INR' },
    contact: { phone: '', email: '', website: '' },
    policies: { cancellation: 'moderate', advance_booking_days: 30, refund_policy: '' }
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const sportsOptions = ['badminton', 'tennis', 'football', 'cricket', 'basketball', 'squash', 'table_tennis', 'volleyball'];
  const amenitiesOptions = ['parking', 'changing_room', 'shower', 'locker', 'cafeteria', 'first_aid', 'lighting', 'washroom', 'water_fountain'];
  const venueTypes = ['indoor', 'outdoor', 'both'];
  const cancellationPolicies = ['flexible', 'moderate', 'strict'];
  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        description: venue.description || '',
        location: {
          address: venue.location?.address || '',
          city: venue.location?.city || '',
          state: venue.location?.state || '',
          country: venue.location?.country || 'India',
          pincode: venue.location?.pincode || ''
        },
        sports: venue.sports || [],
        venueType: venue.venueType || '',
        amenities: venue.amenities || [],
        availability: {
          openTime: venue.availability?.openTime || '',
          closeTime: venue.availability?.closeTime || '',
          weeklyOff: venue.availability?.weeklyOff || []
        },
        pricing: {
          hourly: venue.pricing?.hourly || '',
          currency: venue.pricing?.currency || 'INR'
        },
        contact: {
          phone: venue.contact?.phone || '',
          email: venue.contact?.email || '',
          website: venue.contact?.website || ''
        },
        policies: {
          cancellation: venue.policies?.cancellation || 'moderate',
          advance_booking_days: venue.policies?.advance_booking_days || 30,
          refund_policy: venue.policies?.refund_policy || ''
        }
      });
    }
  }, [venue]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => {
      const currentArray = prev[field];
      const updatedArray = currentArray.includes(value) ? currentArray.filter(item => item !== value) : [...currentArray, value];
      return { ...prev, [field]: updatedArray };
    });
  };

  const handleNestedArrayChange = (parent, field, value) => {
    setFormData(prev => {
      const currentArray = prev[parent][field];
      const updatedArray = currentArray.includes(value) ? currentArray.filter(item => item !== value) : [...currentArray, value];
      return { ...prev, [parent]: { ...prev[parent], [field]: updatedArray } };
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Operational identity required';
    if (!formData.description.trim()) newErrors.description = 'Mission description missing';
    if (!formData.location.address.trim()) newErrors['location.address'] = 'Sector address required';
    if (!formData.location.city.trim()) newErrors['location.city'] = 'City zone required';
    if (!formData.location.state.trim()) newErrors['location.state'] = 'State sector required';
    if (!formData.location.pincode.trim()) newErrors['location.pincode'] = 'Postal coordinates required';
    if (formData.sports.length === 0) newErrors.sports = 'Primary discipline required';
    if (!formData.venueType) newErrors.venueType = 'Arena category required';
    if (!formData.availability.openTime) newErrors['availability.openTime'] = 'Activation time required';
    if (!formData.availability.closeTime) newErrors['availability.closeTime'] = 'Deactivation time required';
    if (!formData.pricing.hourly || formData.pricing.hourly <= 0) newErrors['pricing.hourly'] = 'Valuation required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { toast.error('Check operational telemetry.'); return; }
    try {
      setLoading(true);
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('venueType', formData.venueType);
      submitData.append('locationAddress', formData.location.address);
      submitData.append('locationCity', formData.location.city);
      submitData.append('locationState', formData.location.state);
      submitData.append('locationCountry', formData.location.country);
      submitData.append('locationPincode', formData.location.pincode);
      formData.sports.forEach(sport => submitData.append('sports[]', sport));
      formData.amenities.forEach(amenity => submitData.append('amenities[]', amenity));
      submitData.append('availabilityOpenTime', formData.availability.openTime);
      submitData.append('availabilityCloseTime', formData.availability.closeTime);
      formData.availability.weeklyOff.forEach(day => submitData.append('availabilityWeeklyOff[]', day));
      submitData.append('pricingHourly', formData.pricing.hourly);
      submitData.append('pricingCurrency', formData.pricing.currency);
      submitData.append('contactPhone', formData.contact.phone);
      submitData.append('contactEmail', formData.contact.email);
      submitData.append('contactWebsite', formData.contact.website);
      submitData.append('policiesCancellation', formData.policies.cancellation);
      submitData.append('policiesAdvanceBookingDays', formData.policies.advance_booking_days);
      submitData.append('policiesRefundPolicy', formData.policies.refund_policy);
      images.forEach(image => submitData.append('images', image));

      if (venue) await ownerService.updateVenue(venue._id, submitData);
      else await ownerService.createVenue(submitData);

      toast.success('Infrastructural data synchronized.');
      onSuccess();
    } catch (error) { toast.error('Synchronization failure.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl" />
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[80px] shadow-2xl relative z-10 overflow-hidden flex flex-col font-inter border border-white/20" onClick={e => e.stopPropagation()}>
        <header className="p-16 pb-12 border-b-2 border-gray-50 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 -skew-x-12 translate-x-1/2 blur-3xl" />
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest mb-1">
              <FiShield /> VENUE CONFIGURATION
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">{venue ? 'EDIT' : 'ADD NEW'} <span className="text-primary">VENUE</span></h2>
            <p className="text-lg text-gray-500 font-medium">Managing your facility details and operations.</p>
          </div>
          <button onClick={onClose} className="w-16 h-16 bg-gray-50 text-gray-400 rounded-[24px] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-500 shadow-sm border border-transparent hover:rotate-90 group">
            <FiX size={28} className="group-hover:scale-110" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-16 space-y-20 custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
            {/* Phase 1: Basic Intel */}
            <section className="space-y-12">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide flex items-center gap-3">
                  <FiInfo className="text-primary" /> BASIC DETAILS
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Core Information about your venue</p>
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">VENUE NAME</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`w-full px-8 py-5 rounded-[24px] bg-gray-50 border-2 outline-none font-bold text-gray-900 transition-all ${errors.name ? 'border-red-200' : 'border-transparent focus:border-primary/20 focus:bg-white'}`} placeholder="Enter venue name..." />
                  {errors.name && <p className="text-xs font-bold text-red-500 mt-1 ml-1">{errors.name}</p>}
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">DESCRIPTION</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" className={`w-full px-8 py-5 rounded-[24px] bg-gray-50 border-2 outline-none font-medium text-gray-700 transition-all ${errors.description ? 'border-red-200' : 'border-transparent focus:border-primary/20 focus:bg-white'}`} placeholder="Provide a description of your venue..." />
                  {errors.description && <p className="text-xs font-bold text-red-500 mt-1 ml-1">{errors.description}</p>}
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">VENUE IMAGES</label>
                  <label className="flex flex-col items-center justify-center gap-4 w-full px-8 py-10 rounded-[24px] bg-gray-50 border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group relative">
                    <FiCamera className="text-gray-400 group-hover:text-primary transition-colors" size={32} />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors">UPLOAD IMAGES</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            </section>

            {/* Phase 2: Coordinates */}
            <section className="space-y-12">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide flex items-center gap-3">
                  <FiMapPin className="text-primary" /> LOCATION
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Venue Address Details</p>
              </div>
              <div className="space-y-8 p-12 bg-gray-50/50 rounded-[60px] border border-gray-50">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">STREET ADDRESS</label>
                  <input type="text" name="location.address" value={formData.location.address} onChange={handleInputChange} className={`w-full px-8 py-5 rounded-[24px] bg-white border-2 outline-none font-bold text-gray-900 transition-all ${errors['location.address'] ? 'border-red-200' : 'border-gray-100 focus:border-primary/30'}`} placeholder="Enter street address" />
                  {errors['location.address'] && <p className="text-xs font-bold text-red-500 mt-1 ml-1">{errors['location.address']}</p>}
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">CITY</label>
                    <input type="text" name="location.city" value={formData.location.city} onChange={handleInputChange} className="w-full px-8 py-5 rounded-[24px] bg-white border-2 border-gray-100 focus:border-primary/30 outline-none font-bold text-gray-900 transition-all" placeholder="Enter city" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">STATE</label>
                    <input type="text" name="location.state" value={formData.location.state} onChange={handleInputChange} className="w-full px-8 py-5 rounded-[24px] bg-white border-2 border-gray-100 focus:border-primary/30 outline-none font-bold text-gray-900 transition-all" placeholder="Enter state" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">PINCODE</label>
                  <input type="text" name="location.pincode" value={formData.location.pincode} onChange={handleInputChange} className="w-full px-8 py-5 rounded-[24px] bg-white border-2 border-gray-100 focus:border-primary/30 outline-none font-bold text-gray-900 transition-all" placeholder="Enter pincode" />
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
            {/* Phase 3: Operations */}
            <section className="space-y-12">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide flex items-center gap-3">
                  <FiActivity className="text-primary" /> SPORTS & AMENITIES
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Available Sports and Facilities</p>
              </div>
              <div className="space-y-10">
                <div className="space-y-6">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">AVAILABLE SPORTS</label>
                  <div className="flex flex-wrap gap-3">
                    {sportsOptions.map(sport => (
                      <button key={sport} type="button" onClick={() => handleArrayChange('sports', sport)} className={`px-6 py-3 rounded-[16px] text-xs font-bold uppercase tracking-wide border-2 transition-all flex items-center gap-2 ${formData.sports.includes(sport) ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-primary/40'}`}>
                        {formData.sports.includes(sport) ? <FiCheck /> : <FiPlus />} {sport.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">VENUE TYPE</label>
                  <select name="venueType" value={formData.venueType} onChange={handleInputChange} className="w-full px-8 py-5 rounded-[24px] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/30 outline-none font-bold text-gray-900 transition-all uppercase appearance-none cursor-pointer">
                    <option value="">SELECT TYPE</option>
                    {venueTypes.map(type => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-6">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">AMENITIES</label>
                  <div className="flex flex-wrap gap-3">
                    {amenitiesOptions.map(amenity => (
                      <button key={amenity} type="button" onClick={() => handleArrayChange('amenities', amenity)} className={`px-6 py-3 rounded-[16px] text-xs font-bold uppercase tracking-wide border-2 transition-all flex items-center gap-2 ${formData.amenities.includes(amenity) ? 'bg-secondary border-secondary text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-secondary/40'}`}>
                        {formData.amenities.includes(amenity) ? <FiCheck /> : <FiPlus />} {amenity.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Phase 4: Temporal & Financial */}
            <section className="space-y-12">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide flex items-center gap-3">
                  <FiClock className="text-primary" /> AVAILABILITY & PRICING
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Timing and Booking Costs</p>
              </div>
              <div className="space-y-10 p-12 bg-gray-900 rounded-[60px] border border-white/5 shadow-2xl relative overflow-hidden group/dark">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-[0.05] -skew-x-12 translate-x-1/2" />
                <div className="grid grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-primary uppercase tracking-widest ml-1">OPEN TIME</label>
                    <input type="time" name="availability.openTime" value={formData.availability.openTime} onChange={handleInputChange} className="w-full px-6 py-4 rounded-[20px] bg-white/5 border-2 border-gray-700 focus:border-primary/40 focus:bg-white/10 outline-none font-bold text-white transition-all" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-primary uppercase tracking-widest ml-1">CLOSE TIME</label>
                    <input type="time" name="availability.closeTime" value={formData.availability.closeTime} onChange={handleInputChange} className="w-full px-6 py-4 rounded-[20px] bg-white/5 border-2 border-gray-700 focus:border-primary/40 focus:bg-white/10 outline-none font-bold text-white transition-all" />
                  </div>
                </div>
                <div className="space-y-6 relative z-10">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">WEEKLY OFF DAYS</label>
                  <div className="flex flex-wrap gap-3">
                    {weekDays.map(day => (
                      <button key={day} type="button" onClick={() => handleNestedArrayChange('availability', 'weeklyOff', day)} className={`px-4 py-2 rounded-[12px] text-xs font-bold uppercase tracking-wide border transition-all ${formData.availability.weeklyOff.includes(day) ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/20 text-white/60 hover:border-primary/40'}`}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 relative z-10">
                  <label className="text-xs font-bold text-primary uppercase tracking-widest ml-1">HOURLY PRICE (₹)</label>
                  <div className="relative group/input">
                    <FiDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <input type="number" name="pricing.hourly" value={formData.pricing.hourly} onChange={handleInputChange} min="1" className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-white/5 border-2 border-gray-700 focus:border-primary/40 focus:bg-white/10 outline-none font-bold text-2xl text-white transition-all" placeholder="500" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Phase 5: Contact & Security */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20 pt-12">
            <section className="space-y-12">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide flex items-center gap-3">
                  <FiPhone className="text-primary" /> CONTACT DETAILS
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">How customers can reach you</p>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">PHONE NUMBER</label>
                    <input type="tel" name="contact.phone" value={formData.contact.phone} onChange={handleInputChange} className="w-full px-8 py-5 rounded-[24px] bg-gray-50 border-2 border-gray-200 focus:border-primary/40 outline-none font-bold text-gray-900 transition-all" placeholder="+91 ..." />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">EMAIL ADDRESS</label>
                    <input type="email" name="contact.email" value={formData.contact.email} onChange={handleInputChange} className="w-full px-8 py-5 rounded-[24px] bg-gray-50 border-2 border-gray-200 focus:border-primary/40 outline-none font-bold text-gray-900 transition-all" placeholder="email@example.com" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">WEBSITE</label>
                  <input type="url" name="contact.website" value={formData.contact.website} onChange={handleInputChange} className="w-full px-8 py-5 rounded-[24px] bg-gray-50 border-2 border-gray-200 focus:border-primary/40 outline-none font-bold text-gray-900 transition-all" placeholder="https://..." />
                </div>
              </div>
            </section>

            <section className="space-y-12">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide flex items-center gap-3">
                  <FiShield className="text-primary" /> BOOKING POLICIES
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cancellation and Refund Rules</p>
              </div>
              <div className="space-y-8 p-12 bg-primary/5 rounded-[60px] border border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">CANCELLATION POLICY</label>
                    <select name="policies.cancellation" value={formData.policies.cancellation} onChange={handleInputChange} className="w-full px-8 py-5 rounded-[24px] bg-white border-2 border-gray-200 focus:border-primary/40 outline-none font-bold text-gray-900 transition-all uppercase appearance-none cursor-pointer">
                      {cancellationPolicies.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ADVANCE BOOKING (DAYS)</label>
                    <input type="number" name="policies.advance_booking_days" value={formData.policies.advance_booking_days} onChange={handleInputChange} min="1" max="365" className="w-full px-8 py-5 rounded-[24px] bg-white border-2 border-gray-200 focus:border-primary/40 outline-none font-bold text-gray-900 transition-all" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">REFUND POLICY DETAILS</label>
                  <textarea name="policies.refund_policy" value={formData.policies.refund_policy} onChange={handleInputChange} rows="3" className="w-full px-8 py-5 rounded-[24px] bg-white border-2 border-gray-200 focus:border-primary/40 outline-none font-medium text-gray-700 transition-all leading-relaxed" placeholder="Describe the refund rules..." />
                </div>
              </div>
            </section>
          </div>
        </form>

        <footer className="p-16 bg-gray-50/80 border-t-2 border-gray-100 flex flex-col md:flex-row justify-between items-center gap-12 relative z-10 shrink-0">
          <button type="button" onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-all duration-300">
            Cancel
          </button>
          <div className="flex items-center gap-8">
            <button type="submit" onClick={handleSubmit} disabled={loading} className="bg-gray-900 text-white px-12 py-5 rounded-[24px] font-bold text-sm uppercase tracking-wide shadow-2xl hover:bg-primary hover:scale-[1.02] disabled:opacity-50 transition-all duration-300 flex items-center gap-3">
              {loading ? (
                <span className="flex items-center gap-3"><FiActivity className="animate-spin" /> Saving...</span>
              ) : (
                <span className="flex items-center gap-3">Save Venue <FiCheck /></span>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default VenueModal;
