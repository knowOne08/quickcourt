// frontend/src/components/venue/VenueModal.js
import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/ownerService';

const VenueModal = ({ venue, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: ''
    },
    sports: [],
    venueType: '',
    amenities: [],
    availability: {
      openTime: '',
      closeTime: '',
      weeklyOff: []
    },
    pricing: {
      hourly: '',
      currency: 'usd'
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    policies: {
      cancellation: 'moderate',
      advance_booking_days: 30,
      refund_policy: ''
    }
  });
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const sportsOptions = [
    'badminton', 'tennis', 'football', 'cricket', 'basketball', 
    'squash', 'table_tennis', 'volleyball'
  ];

  const amenitiesOptions = [
    'parking', 'changing_room', 'shower', 'locker', 'cafeteria',
    'first_aid', 'equipment_rental', 'coaching', 'wifi', 'air_conditioning',
    'lighting', 'seating', 'washroom', 'water_fountain'
  ];

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
          currency: venue.pricing?.currency || 'usd'
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
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => {
      const currentArray = prev[field];
      const updatedArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return { ...prev, [field]: updatedArray };
    });
  };

  const handleNestedArrayChange = (parent, field, value) => {
    setFormData(prev => {
      const currentArray = prev[parent][field];
      const updatedArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: updatedArray
        }
      };
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Venue name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.address.trim()) newErrors['location.address'] = 'Address is required';
    if (!formData.location.city.trim()) newErrors['location.city'] = 'City is required';
    if (!formData.location.state.trim()) newErrors['location.state'] = 'State is required';
    if (!formData.location.pincode.trim()) newErrors['location.pincode'] = 'Pincode is required';
    if (formData.sports.length === 0) newErrors.sports = 'At least one sport is required';
    if (!formData.venueType) newErrors.venueType = 'Venue type is required';
    if (!formData.availability.openTime) newErrors['availability.openTime'] = 'Opening time is required';
    if (!formData.availability.closeTime) newErrors['availability.closeTime'] = 'Closing time is required';
    if (!formData.pricing.hourly || formData.pricing.hourly <= 0) newErrors['pricing.hourly'] = 'Valid hourly price is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const submitData = new FormData();
      
      // Add basic fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('venueType', formData.venueType);
      
      // Add location fields with simple naming
      submitData.append('locationAddress', formData.location.address);
      submitData.append('locationCity', formData.location.city);
      submitData.append('locationState', formData.location.state);
      submitData.append('locationCountry', formData.location.country);
      submitData.append('locationPincode', formData.location.pincode);
      
      // Add sports array
      formData.sports.forEach(sport => {
        submitData.append('sports[]', sport);
      });
      
      // Add amenities array
      formData.amenities.forEach(amenity => {
        submitData.append('amenities[]', amenity);
      });
      
      // Add availability fields
      submitData.append('availabilityOpenTime', formData.availability.openTime);
      submitData.append('availabilityCloseTime', formData.availability.closeTime);
      formData.availability.weeklyOff.forEach(day => {
        submitData.append('availabilityWeeklyOff[]', day);
      });
      
      // Add pricing fields
      submitData.append('pricingHourly', formData.pricing.hourly);
      submitData.append('pricingCurrency', formData.pricing.currency);
      
      // Add contact fields
      submitData.append('contactPhone', formData.contact.phone);
      submitData.append('contactEmail', formData.contact.email);
      submitData.append('contactWebsite', formData.contact.website);
      
      // Add policies fields
      submitData.append('policiesCancellation', formData.policies.cancellation);
      submitData.append('policiesAdvanceBookingDays', formData.policies.advance_booking_days);
      submitData.append('policiesRefundPolicy', formData.policies.refund_policy);
      
      // Add images
      images.forEach(image => {
        submitData.append('images', image);
      });

      console.log('Submitting venue data...');
      // Log FormData contents for debugging
      for (let pair of submitData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      if (venue) {
        await ownerService.updateVenue(venue._id, submitData);
      } else {
        await ownerService.createVenue(submitData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving venue:', error);
      
      // Better error handling
      let errorMessage = 'Failed to save venue. Please try again.';
      
      if (error.response?.status === 400) {
        // Validation error from backend
        errorMessage = error.response.data?.message || 'Please check your input and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create venues.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content venue-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{venue ? 'Edit Venue' : 'Add New Venue'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="venue-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Venue Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="images">Venue Images</label>
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Location</h3>
            
            <div className="form-group">
              <label htmlFor="location.address">Address *</label>
              <input
                type="text"
                id="location.address"
                name="location.address"
                value={formData.location.address}
                onChange={handleInputChange}
                className={errors['location.address'] ? 'error' : ''}
              />
              {errors['location.address'] && <span className="error-text">{errors['location.address']}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location.city">City *</label>
                <input
                  type="text"
                  id="location.city"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleInputChange}
                  className={errors['location.city'] ? 'error' : ''}
                />
                {errors['location.city'] && <span className="error-text">{errors['location.city']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="location.state">State *</label>
                <input
                  type="text"
                  id="location.state"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleInputChange}
                  className={errors['location.state'] ? 'error' : ''}
                />
                {errors['location.state'] && <span className="error-text">{errors['location.state']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="location.pincode">Pincode *</label>
                <input
                  type="text"
                  id="location.pincode"
                  name="location.pincode"
                  value={formData.location.pincode}
                  onChange={handleInputChange}
                  className={errors['location.pincode'] ? 'error' : ''}
                />
                {errors['location.pincode'] && <span className="error-text">{errors['location.pincode']}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Sports & Type</h3>
            
            <div className="form-group">
              <label>Sports Available *</label>
              <div className="checkbox-group">
                {sportsOptions.map(sport => (
                  <label key={sport} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.sports.includes(sport)}
                      onChange={() => handleArrayChange('sports', sport)}
                    />
                    {sport.charAt(0).toUpperCase() + sport.slice(1).replace('_', ' ')}
                  </label>
                ))}
              </div>
              {errors.sports && <span className="error-text">{errors.sports}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="venueType">Venue Type *</label>
              <select
                id="venueType"
                name="venueType"
                value={formData.venueType}
                onChange={handleInputChange}
                className={errors.venueType ? 'error' : ''}
              >
                <option value="">Select venue type</option>
                {venueTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              {errors.venueType && <span className="error-text">{errors.venueType}</span>}
            </div>

            <div className="form-group">
              <label>Amenities</label>
              <div className="checkbox-group">
                {amenitiesOptions.map(amenity => (
                  <label key={amenity} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleArrayChange('amenities', amenity)}
                    />
                    {amenity.charAt(0).toUpperCase() + amenity.slice(1).replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Availability</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="availability.openTime">Opening Time *</label>
                <input
                  type="time"
                  id="availability.openTime"
                  name="availability.openTime"
                  value={formData.availability.openTime}
                  onChange={handleInputChange}
                  className={errors['availability.openTime'] ? 'error' : ''}
                />
                {errors['availability.openTime'] && <span className="error-text">{errors['availability.openTime']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="availability.closeTime">Closing Time *</label>
                <input
                  type="time"
                  id="availability.closeTime"
                  name="availability.closeTime"
                  value={formData.availability.closeTime}
                  onChange={handleInputChange}
                  className={errors['availability.closeTime'] ? 'error' : ''}
                />
                {errors['availability.closeTime'] && <span className="error-text">{errors['availability.closeTime']}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Weekly Off Days</label>
              <div className="checkbox-group">
                {weekDays.map(day => (
                  <label key={day} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.availability.weeklyOff.includes(day)}
                      onChange={() => handleNestedArrayChange('availability', 'weeklyOff', day)}
                    />
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Pricing</h3>
            
            <div className="form-group">
              <label htmlFor="pricing.hourly">Hourly Rate (₹) *</label>
              <input
                type="number"
                id="pricing.hourly"
                name="pricing.hourly"
                value={formData.pricing.hourly}
                onChange={handleInputChange}
                min="1"
                className={errors['pricing.hourly'] ? 'error' : ''}
              />
              {errors['pricing.hourly'] && <span className="error-text">{errors['pricing.hourly']}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contact.phone">Phone</label>
                <input
                  type="tel"
                  id="contact.phone"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact.email">Email</label>
                <input
                  type="email"
                  id="contact.email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contact.website">Website</label>
              <input
                type="url"
                id="contact.website"
                name="contact.website"
                value={formData.contact.website}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Policies</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="policies.cancellation">Cancellation Policy</label>
                <select
                  id="policies.cancellation"
                  name="policies.cancellation"
                  value={formData.policies.cancellation}
                  onChange={handleInputChange}
                >
                  {cancellationPolicies.map(policy => (
                    <option key={policy} value={policy}>
                      {policy.charAt(0).toUpperCase() + policy.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="policies.advance_booking_days">Advance Booking Days</label>
                <input
                  type="number"
                  id="policies.advance_booking_days"
                  name="policies.advance_booking_days"
                  value={formData.policies.advance_booking_days}
                  onChange={handleInputChange}
                  min="1"
                  max="365"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="policies.refund_policy">Refund Policy</label>
              <textarea
                id="policies.refund_policy"
                name="policies.refund_policy"
                value={formData.policies.refund_policy}
                onChange={handleInputChange}
                rows="2"
              />
            </div>
          </div>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (venue ? 'Update Venue' : 'Create Venue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VenueModal;
