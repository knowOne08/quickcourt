// backend/src/utils/addMoreVenues.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Court = require('../models/Court');
const logger = require('./logger');

const addMoreVenues = async () => {
  try {
    // Get a venue owner
    const owner = await User.findOne({ role: 'facility_owner' });
    if (!owner) {
      logger.error('No venue owner found. Please run seedData first.');
      return;
    }

    const additionalVenues = [
      {
        name: 'Squash Pro Center',
        description: 'Professional squash facility with glass courts and coaching',
        owner: owner._id,
        location: {
          address: '555 Squash Lane',
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '380003',
          coordinates: [72.5914, 23.0425]
        },
        sports: ['squash'],
        venueType: 'indoor',
        amenities: ['parking', 'changing_room', 'shower', 'locker', 'coaching', 'wifi', 'air_conditioning'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
            caption: 'Glass Court'
          }
        ],
        availability: {
          openTime: '06:00',
          closeTime: '22:00',
          weeklyOff: ['sunday']
        },
        pricing: {
          hourly: 450,
          currency: 'INR',
          peakHours: [
            {
              startTime: '18:00',
              endTime: '21:00',
              multiplier: 1.4
            }
          ]
        },
        rating: {
          average: 4.6,
          count: 16,
          breakdown: { 5: 10, 4: 4, 3: 2, 2: 0, 1: 0 }
        },
        contact: {
          phone: '9876543220',
          email: 'info@squashpro.com'
        },
        status: 'approved',
        isActive: true
      },
      {
        name: 'Volleyball Arena',
        description: 'Indoor volleyball facility with multiple courts',
        owner: owner._id,
        location: {
          address: '777 Volleyball Street',
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '380004',
          coordinates: [72.6014, 23.0525]
        },
        sports: ['volleyball'],
        venueType: 'indoor',
        amenities: ['parking', 'changing_room', 'shower', 'locker', 'coaching', 'wifi', 'air_conditioning'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
            caption: 'Main Court'
          }
        ],
        availability: {
          openTime: '07:00',
          closeTime: '23:00',
          weeklyOff: ['sunday']
        },
        pricing: {
          hourly: 300,
          currency: 'INR',
          peakHours: [
            {
              startTime: '18:00',
              endTime: '22:00',
              multiplier: 1.3
            }
          ]
        },
        rating: {
          average: 4.4,
          count: 22,
          breakdown: { 5: 14, 4: 6, 3: 2, 2: 0, 1: 0 }
        },
        contact: {
          phone: '9876543221',
          email: 'info@volleyballarena.com'
        },
        status: 'approved',
        isActive: true
      },
      {
        name: 'Swimming Complex',
        description: 'Olympic-size swimming pool with multiple lanes',
        owner: owner._id,
        location: {
          address: '888 Pool Road',
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '380005',
          coordinates: [72.6114, 23.0625]
        },
        sports: ['badminton'], // Changed from 'swimming' to valid sport
        venueType: 'indoor',
        amenities: ['parking', 'changing_room', 'shower', 'locker', 'coaching', 'wifi', 'air_conditioning'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
            caption: 'Main Pool'
          }
        ],
        availability: {
          openTime: '06:00',
          closeTime: '22:00',
          weeklyOff: ['monday']
        },
        pricing: {
          hourly: 600,
          currency: 'INR',
          peakHours: [
            {
              startTime: '17:00',
              endTime: '21:00',
              multiplier: 1.5
            }
          ]
        },
        rating: {
          average: 4.7,
          count: 28,
          breakdown: { 5: 18, 4: 8, 3: 2, 2: 0, 1: 0 }
        },
        contact: {
          phone: '9876543222',
          email: 'info@swimmingcomplex.com'
        },
        status: 'approved',
        isActive: true
      },
      {
        name: 'Gym & Fitness Center',
        description: 'Modern fitness facility with equipment and classes',
        owner: owner._id,
        location: {
          address: '999 Fitness Avenue',
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '380006',
          coordinates: [72.6214, 23.0725]
        },
        sports: ['basketball'], // Changed from invalid sports to valid sport
        venueType: 'indoor',
        amenities: ['parking', 'changing_room', 'shower', 'locker', 'coaching', 'wifi', 'air_conditioning'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
            caption: 'Main Gym'
          }
        ],
        availability: {
          openTime: '05:00',
          closeTime: '24:00',
          weeklyOff: []
        },
        pricing: {
          hourly: 250,
          currency: 'INR',
          peakHours: [
            {
              startTime: '06:00',
              endTime: '09:00',
              multiplier: 1.2
            },
            {
              startTime: '18:00',
              endTime: '21:00',
              multiplier: 1.4
            }
          ]
        },
        rating: {
          average: 4.5,
          count: 35,
          breakdown: { 5: 20, 4: 10, 3: 4, 2: 1, 1: 0 }
        },
        contact: {
          phone: '9876543223',
          email: 'info@fitnesscenter.com'
        },
        status: 'approved',
        isActive: true
      }
    ];

    // Create additional venues
    const createdVenues = await Venue.create(additionalVenues);
    logger.info(`Created ${createdVenues.length} additional venues`);

    // Create courts for each new venue
    const newCourts = [];
    
    for (const venue of createdVenues) {
      let courtCount, sportType;
      
      if (venue.sports.includes('squash')) {
        courtCount = 2;
        sportType = 'squash';
      } else if (venue.sports.includes('volleyball')) {
        courtCount = 3;
        sportType = 'volleyball';
      } else if (venue.sports.includes('badminton')) {
        courtCount = 3;
        sportType = 'badminton';
      } else {
        courtCount = 4;
        sportType = 'basketball';
      }
      
      for (let i = 1; i <= courtCount; i++) {
        const court = await Court.create({
          venue: venue._id,
          name: `${sportType.charAt(0).toUpperCase() + sportType.slice(1)} ${i}`,
          sport: sportType,
          type: venue.venueType,
          surface: 'concrete',
                  dimensions: {
          length: 20,
          width: 15,
          unit: 'meters'
        },
          amenities: ['lighting', 'seating'],
          pricePerHour: venue.pricing.hourly,
          peakHourPricing: {
            enabled: true,
            pricePerHour: venue.pricing.hourly * 1.3,
            hours: [
              {
                start: '18:00',
                end: '21:00'
              }
            ]
          },
          availability: {
            monday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            tuesday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            wednesday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            thursday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            friday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            saturday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            sunday: venue.availability.weeklyOff?.includes('sunday') ? { isOpen: false, hours: [] } : { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] }
          },
          isActive: true,
          totalBookings: Math.floor(Math.random() * 30) + 5,
          rating: {
            average: venue.rating.average - (Math.random() * 0.3),
            count: Math.floor(Math.random() * 15) + 3
          }
        });
        
        newCourts.push(court);
      }
      
      // Add courts to venue
      venue.courts = newCourts.filter(c => c.venue.toString() === venue._id.toString()).map(c => c._id);
      await venue.save();
    }

    logger.info(`Created ${newCourts.length} additional courts`);
    
    return { venues: createdVenues, courts: newCourts };
  } catch (error) {
    logger.error('Error adding more venues:', error);
    throw error;
  }
};

module.exports = addMoreVenues;
