// frontend/src/pages/owner/AddVenue.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { 
  FiArrowLeft, FiPlus, FiTrash2, FiMapPin, FiInfo, 
  FiCamera, FiCheck, FiActivity, FiClock, FiDollarSign, FiChevronRight, FiGrid, FiShield, FiBox, FiLayers
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const AddVenue = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venueType: 'indoor',
    location: { address: '', city: '', state: '', pincode: '' },
    availability: { openTime: '06:00', closeTime: '22:00', weeklyOff: [] },
    pricing: { hourly: '' },
    amenities: [],
    images: [], 
    sports: [],
    slotDuration: 60,
    courts: [{ name: '', sport: 'badminton', pricePerHour: '' }]
  });

  const availableAmenities = [
    { id: 'parking', label: 'PARKING' },
    { id: 'changing_room', label: 'CHANGING ROOM' },
    { id: 'washroom', label: 'WASHROOM' },
    { id: 'cafeteria', label: 'CAFETERIA' },
    { id: 'first_aid', label: 'FIRST AID' },
    { id: 'lighting', label: 'NIGHT LIGHTING' }
  ];

  const sportsOptions = [
    'badminton', 'tennis', 'football', 'cricket', 'basketball', 'squash', 'table_tennis', 'volleyball'
  ];

  const handleInputChange = (e, section = null) => {
    const { name, value } = e.target;
    if (section) {
      setFormData(prev => ({
        ...prev, section: { ...prev[section], [name]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAmenityToggle = (amenityId) => {
    setFormData(prev => {
      const updated = prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities: updated };
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleCourtChange = (index, field, value) => {
    setFormData(prev => {
      const updatedCourts = [...prev.courts];
      updatedCourts[index][field] = value;
      const uniqueSports = [...new Set(updatedCourts.map(c => c.sport).filter(Boolean))];
      return { ...prev, courts: updatedCourts, sports: uniqueSports };
    });
  };

  const addCourt = () => {
    setFormData(prev => ({
      ...prev,
      courts: [...prev.courts, { name: '', sport: 'badminton', pricePerHour: '' }]
    }));
  };

  const removeCourt = (index) => {
    setFormData(prev => {
      const updatedCourts = prev.courts.filter((_, i) => i !== index);
      const uniqueSports = [...new Set(updatedCourts.map(c => c.sport).filter(Boolean))];
      return { ...prev, courts: updatedCourts, sports: uniqueSports };
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.description || !formData.location.address || !formData.location.city || !formData.location.pincode) {
      setStep(1);
      toast.error('Phase 1 coordinates required');
      return;
    }
    if (!formData.availability.openTime || !formData.availability.closeTime) {
      setStep(2);
      toast.error('Phase 2 temporal windows required');
      return;
    }

    try {
      setLoading(true);
      const hourlyPrice = parseFloat(formData.pricing.hourly || (formData.courts.length > 0 ? formData.courts[0].pricePerHour : 0));
      if (isNaN(hourlyPrice)) {
        toast.error('Invalid valuation parameters');
        setLoading(false);
        return;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        venueType: formData.venueType,
        location: {
          address: formData.location.address,
          city: formData.location.city,
          state: formData.location.state || 'Maharashtra',
          pincode: formData.location.pincode,
          coordinates: [72.8777, 19.0760]
        },
        availability: {
          openTime: formData.availability.openTime,
          closeTime: formData.availability.closeTime,
          weeklyOff: []
        },
        pricing: { hourly: hourlyPrice, currency: 'INR' },
        slotDuration: Number(formData.slotDuration),
        amenities: formData.amenities,
        sports: formData.sports.length > 0 ? formData.sports : ['badminton'],
        images: [{ url: 'https://images.unsplash.com/photo-1545116832-82e9071f9959?q=80&w=800', caption: 'Main Sector' }]
      };

      const response = await ownerService.createVenue(payload);
      if (response.data.status === 'success') {
        const venueId = response.data.data.venue._id;
        if (formData.courts && formData.courts.length > 0) {
          const courtPromises = formData.courts.map(court => 
            ownerService.createCourt(venueId, {
              name: court.name || 'Alpha Unit',
              sport: court.sport || 'badminton',
              pricePerHour: Number(court.pricePerHour || hourlyPrice),
              isActive: true
            })
          );
          await Promise.all(courtPromises);
        }
        toast.success('Infrastructural synchronization complete.');
        navigate('/owner/dashboard');
      }
    } catch (error) {
      toast.error('Deployment signal failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-24 px-6 md:px-12 font-inter relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-screen bg-primary opacity-[0.02] -skew-x-12 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/3 h-screen bg-secondary opacity-[0.01] skew-x-12 -translate-x-1/2" />
      
      <div className="max-w-6xl w-full bg-white rounded-[80px] shadow-premium border border-gray-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 -skew-x-12 translate-x-1/2" />
        
        <header className="p-16 pb-12 flex flex-col xl:flex-row xl:items-center justify-between gap-12 border-b border-gray-50 relative z-10">
          <div className="flex items-center gap-10">
            <button onClick={() => navigate(-1)} className="w-16 h-16 bg-gray-50 text-gray-400 rounded-[24px] flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-500 shadow-sm border border-transparent hover:rotate-12">
              <FiArrowLeft size={24} />
            </button>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">
                <FiBox /> ASSET INITIALIZATION
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">DEPLOY <br/><span className="text-primary underline decoration-primary/10">INFRASTRUCTURE</span></h1>
              <p className="text-xl text-gray-400 font-medium italic">PHASE {step} OF 3 • OPERATIONAL SYNC</p>
            </div>
          </div>
          <div className="flex gap-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex flex-col items-center gap-3">
                <div className={`h-2 w-16 md:w-24 rounded-full transition-all duration-700 ${step >= s ? 'bg-primary shadow-[0_0_20px_rgba(113,75,103,0.4)]' : 'bg-gray-100'}`} />
                <span className={`text-[8px] font-black italic tracking-widest ${step >= s ? 'text-primary' : 'text-gray-300'}`}>0{s}</span>
              </div>
            ))}
          </div>
        </header>

        <main className="p-16 relative z-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-16">
            {step === 1 && (
              <div className="space-y-16 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">FACILITY DESIGNATION</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-10 py-6 rounded-[32px] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-inner" placeholder="E.G. APEX COMBAT ARENA" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">ARENA CATEGORY</label>
                    <select name="venueType" value={formData.venueType} onChange={handleInputChange} className="w-full px-10 py-6 rounded-[32px] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-inner appearance-none cursor-pointer">
                      <option value="indoor">INDOOR (PRESSURIZED)</option>
                      <option value="outdoor">OUTDOOR (OPEN FIELD)</option>
                      <option value="both">HYBRID (MIXED ZONE)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">OPERATIONAL DESCRIPTION</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-10 py-8 rounded-[40px] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 outline-none font-medium text-gray-700 transition-all min-h-[180px] italic leading-relaxed shadow-inner" placeholder="PROVIDE DETAILED TELEMETRY ON YOUR FACILITIES..." />
                </div>

                <div className="pt-8 space-y-12 bg-gray-50/50 p-12 rounded-[60px] border border-gray-50">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3 italic">
                      <FiMapPin className="text-primary" /> SECTOR COORDINATES
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">GEOSPATIAL DEPLOYMENT TARGET</p>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">STREET ADDRESS</label>
                    <input type="text" name="address" value={formData.location.address} onChange={(e) => handleInputChange(e, 'location')} className="w-full px-10 py-6 rounded-[32px] bg-white border-2 border-transparent focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-sm" placeholder="ARENA DEPLOYMENT LOCATION..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">CITY</label>
                      <input type="text" name="city" value={formData.location.city} onChange={(e) => handleInputChange(e, 'location')} className="w-full px-10 py-6 rounded-[32px] bg-white border-2 border-transparent focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-sm" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">STATE</label>
                      <input type="text" name="state" value={formData.location.state} onChange={(e) => handleInputChange(e, 'location')} className="w-full px-10 py-6 rounded-[32px] bg-white border-2 border-transparent focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-sm" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">POSTAL CODE</label>
                      <input type="text" name="pincode" value={formData.location.pincode} onChange={(e) => handleInputChange(e, 'location')} className="w-full px-10 py-6 rounded-[32px] bg-white border-2 border-transparent focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-16 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">ACTIVATION</label>
                    <input type="time" name="openTime" value={formData.availability.openTime} onChange={(e) => handleInputChange(e, 'availability')} className="w-full px-10 py-6 rounded-[32px] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-inner" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">DEACTIVATION</label>
                    <input type="time" name="closeTime" value={formData.availability.closeTime} onChange={(e) => handleInputChange(e, 'availability')} className="w-full px-10 py-6 rounded-[32px] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-inner" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">VALUATION (₹/HR)</label>
                    <input type="number" name="hourly" value={formData.pricing.hourly} onChange={(e) => handleInputChange(e, 'pricing')} className="w-full px-10 py-6 rounded-[32px] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-inner" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">TEMPORAL WINDOWS</label>
                    <select name="slotDuration" value={formData.slotDuration} onChange={handleInputChange} className="w-full px-10 py-6 rounded-[32px] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-inner appearance-none cursor-pointer">
                      <option value={30}>30 MINS CYCLE</option>
                      <option value={60}>60 MINS CYCLE</option>
                      <option value={90}>90 MINS CYCLE</option>
                      <option value={120}>120 MINS CYCLE</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3 italic">
                      <FiLayers className="text-primary" /> INTEGRATED AMENITIES
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">SUBSYSTEM CAPABILITIES</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {availableAmenities.map(amenity => (
                      <button key={amenity.id} type="button" onClick={() => handleAmenityToggle(amenity.id)} className={`px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] border-2 transition-all duration-500 flex items-center gap-3 italic shadow-premium ${formData.amenities.includes(amenity.id) ? 'bg-primary border-primary text-white shadow-primary/30 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-primary/30'}`}>
                        {formData.amenities.includes(amenity.id) ? <FiCheck /> : <FiPlus />} {amenity.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3 italic">
                      <FiCamera className="text-primary" /> VISUAL ASSETS
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">INFRASTRUCTURE TELEMETRY IMAGERY</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    <button type="button" onClick={() => fileInputRef.current.click()} className="aspect-square rounded-[40px] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all duration-500 group relative overflow-hidden">
                      <FiPlus size={40} className="group-hover:scale-110 group-hover:rotate-90 transition-all duration-700" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] mt-4 italic">ADD INTEL</span>
                      <input type="file" multiple hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                    </button>
                    {formData.images.map((img, i) => (
                      <div key={i} className="aspect-square rounded-[40px] overflow-hidden relative group shadow-premium border-2 border-white">
                        <img src={img.preview} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <FiTrash2 size={32} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-16 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3 italic">
                      <FiGrid className="text-primary" /> ARENA CONFIGURATION
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">OPERATIONAL UNIT ALLOCATION</p>
                  </div>
                  <button type="button" onClick={addCourt} className="bg-gray-900 text-white px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-primary transition-all duration-500 italic shadow-2xl">
                    <FiPlus /> ADD OPERATIONAL UNIT
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {formData.courts.map((court, index) => (
                    <div key={index} className="bg-white rounded-[50px] p-12 space-y-10 relative group border border-gray-100 hover:border-primary/20 shadow-premium transition-all duration-700 overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -skew-x-12 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
                      <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] italic leading-none">UNIT 0{index + 1}</h4>
                        {formData.courts.length > 1 && (
                          <button type="button" onClick={() => removeCourt(index)} className="w-14 h-14 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white shadow-inner transition-all duration-500">
                            <FiTrash2 size={20} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-8 relative z-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">UNIT DESIGNATION</label>
                          <input type="text" value={court.name} onChange={(e) => handleCourtChange(index, 'name', e.target.value)} className="w-full px-10 py-6 rounded-[30px] bg-gray-50 border-2 border-transparent focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-inner" placeholder="E.G. SECTOR ALPHA" />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">DISCIPLINE</label>
                            <select value={court.sport} onChange={(e) => handleCourtChange(index, 'sport', e.target.value)} className="w-full px-10 py-6 rounded-[30px] bg-gray-50 border-2 border-transparent focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-inner appearance-none cursor-pointer">
                              {sportsOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 italic">HOURLY FEE (₹)</label>
                            <input type="number" value={court.pricePerHour} onChange={(e) => handleCourtChange(index, 'pricePerHour', e.target.value)} className="w-full px-10 py-6 rounded-[30px] bg-gray-50 border-2 border-transparent focus:border-primary/20 outline-none font-black text-gray-900 transition-all uppercase italic shadow-inner" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </main>

        <footer className="p-16 bg-gray-50/80 flex flex-col md:flex-row justify-between items-center gap-10 relative z-10 border-t border-gray-100">
          <button type="button" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] hover:text-gray-900 transition-all duration-500 italic">
            {step > 1 ? 'PHASE REVERSE' : 'ABORT DEPLOYMENT'}
          </button>
          <div className="flex items-center gap-8">
            {step < 3 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="bg-primary text-white px-16 py-7 rounded-[35px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 hover:bg-gray-900 hover:scale-105 active:scale-100 transition-all duration-500 flex items-center gap-4 italic group">
                PHASE ADVANCE <FiChevronRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="bg-gray-900 text-white px-16 py-7 rounded-[35px] font-black text-[11px] uppercase tracking-[0.4em] shadow-premium hover:bg-primary hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all duration-700 flex items-center gap-4 italic group">
                {loading ? (
                  <span className="flex items-center gap-3"><FiActivity className="animate-spin" /> SYNCHRONIZING...</span>
                ) : (
                  <span className="flex items-center gap-3">FINALIZE DEPLOYMENT <FiCheck className="group-hover:scale-125 transition-transform" /></span>
                )}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AddVenue;
