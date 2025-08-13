const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Court = require('../models/Court');
const seedBookings = require('./seedBookings');
const logger = require('./logger');

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Venue.deleteMany({});
    await Court.deleteMany({});
    
    logger.info('Cleared existing data');

    // Create users
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        phoneNumber: '9876543210',
        isEmailVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user',
        phoneNumber: '9876543211',
        isEmailVerified: true
      },
      {
        name: 'Venue Owner 1',
        email: 'owner1@example.com',
        password: 'password123',
        role: 'facility_owner',
        phoneNumber: '9876543212',
        isEmailVerified: true
      },
      {
        name: 'Venue Owner 2',
        email: 'owner2@example.com',
        password: 'password123',
        role: 'facility_owner',
        phoneNumber: '9876543213',
        isEmailVerified: true
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        phoneNumber: '9876543214',
        isEmailVerified: true
      }
    ]);

    logger.info('Created users');

    // Create venues
    const venues = await Venue.create([
      {
        name: 'SRK Badminton Academy',
        description: 'Premium badminton facility with professional courts and coaching services',
        owner: users[2]._id, // Venue Owner 1
        location: {
          address: '123 Vaishnavdevi Circle',
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '380001',
          coordinates: [72.5714, 23.0225]
        },
        sports: ['badminton'],
        venueType: 'indoor',
        amenities: ['parking', 'changing_room', 'shower', 'locker', 'cafeteria', 'coaching', 'wifi', 'air_conditioning'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=600&fit=crop',
            caption: 'Main Court'
          }
        ],
        availability: {
          openTime: '06:00',
          closeTime: '22:00',
          weeklyOff: ['sunday']
        },
        pricing: {
          hourly: 400,
          currency: 'usd',
          peakHours: [
            {
              startTime: '18:00',
              endTime: '21:00',
              multiplier: 1.5
            }
          ]
        },
        rating: {
          average: 4.5,
          count: 12,
          breakdown: { 5: 8, 4: 3, 3: 1, 2: 0, 1: 0 }
        },
        contact: {
          phone: '9876543210',
          email: 'info@srkbadminton.com'
        },
        status: 'approved',
        isActive: true
      },
      {
        name: 'Elite Football Ground',
        description: 'Professional football ground with FIFA standard turf',
        owner: users[3]._id, // Venue Owner 2
        location: {
          address: '456 Sports Complex',
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '380002',
          coordinates: [72.5814, 23.0325]
        },
        sports: ['football'],
        venueType: 'outdoor',
        amenities: ['parking', 'changing_room', 'shower', 'locker', 'first_aid', 'equipment_rental', 'coaching'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
            caption: 'Main Ground'
          }
        ],
        availability: {
          openTime: '05:00',
          closeTime: '23:00',
          weeklyOff: ['monday']
        },
        pricing: {
          hourly: 800,
          currency: 'usd',
          peakHours: [
            {
              startTime: '17:00',
              endTime: '21:00',
              multiplier: 1.3
            }
          ]
        },
        rating: {
          average: 4.8,
          count: 25,
          breakdown: { 5: 18, 4: 5, 3: 2, 2: 0, 1: 0 }
        },
        contact: {
          phone: '9876543211',
          email: 'info@elitefootball.com'
        },
        status: 'approved',
        isActive: true
      },
      {
        name: 'Cricket Excellence Center',
        description: 'Professional cricket facility with multiple practice nets and coaching',
        owner: users[2]._id,
        location: {
          address: '789 Cricket Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: '400001',
          coordinates: [72.8777, 19.0760]
        },
        sports: ['cricket'],
        venueType: 'outdoor',
        amenities: ['parking', 'changing_room', 'shower', 'locker', 'first_aid', 'equipment_rental', 'coaching'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
            caption: 'Practice Nets'
          }
        ],
        availability: {
          openTime: '06:00',
          closeTime: '22:00',
          weeklyOff: ['sunday']
        },
        pricing: {
          hourly: 600,
          currency: 'usd',
          peakHours: [
            {
              startTime: '16:00',
              endTime: '20:00',
              multiplier: 1.4
            }
          ]
        },
        rating: {
          average: 4.6,
          count: 18,
          breakdown: { 5: 12, 4: 4, 3: 2, 2: 0, 1: 0 }
        },
        contact: {
          phone: '9876543212',
          email: 'info@cricketexcellence.com'
        },
        status: 'approved',
        isActive: true
      },
      {
        name: 'Tennis Pro Academy',
        description: 'Professional tennis facility with clay and hard courts',
        owner: users[3]._id,
        location: {
          address: '321 Tennis Avenue',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          pincode: '110001',
          coordinates: [77.2090, 28.6139]
        },
        sports: ['tennis'],
        venueType: 'outdoor',
        amenities: ['parking', 'changing_room', 'shower', 'locker', 'cafeteria', 'coaching', 'equipment_rental'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=600&fit=crop',
            caption: 'Clay Court'
          }
        ],
        availability: {
          openTime: '06:00',
          closeTime: '22:00',
          weeklyOff: ['monday']
        },
        pricing: {
          hourly: 500,
          currency: 'usd',
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
          count: 15,
          breakdown: { 5: 10, 4: 4, 3: 1, 2: 0, 1: 0 }
        },
        contact: {
          phone: '9876543213',
          email: 'info@tennispro.com'
        },
        status: 'approved',
        isActive: true
      },
      {
        name: 'Basketball Arena',
        description: 'Indoor basketball facility with multiple courts',
        owner: users[2]._id,
        location: {
          address: '654 Sports Street',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          pincode: '560001',
          coordinates: [77.5946, 12.9716]
        },
        sports: ['basketball'],
        venueType: 'indoor',
        amenities: ['parking', 'changing_room', 'shower', 'locker', 'cafeteria', 'coaching', 'wifi', 'air_conditioning'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
            caption: 'Main Court'
          }
        ],
        availability: {
          openTime: '06:00',
          closeTime: '23:00',
          weeklyOff: ['sunday']
        },
        pricing: {
          hourly: 350,
          currency: 'usd',
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
          count: 20,
          breakdown: { 5: 12, 4: 6, 3: 2, 2: 0, 1: 0 }
        },
        contact: {
          phone: '9876543214',
          email: 'info@basketballarena.com'
        },
        status: 'approved',
        isActive: true
      },
      {
        name: 'Table Tennis Club',
        description: 'Professional table tennis facility with multiple tables',
        owner: users[3]._id,
        location: {
          address: '987 TT Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '600001',
          coordinates: [80.2707, 13.0827]
        },
        sports: ['table_tennis'],
        venueType: 'indoor',
        amenities: ['parking', 'changing_room', 'coaching', 'wifi', 'air_conditioning'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800&h=600&fit=crop',
            caption: 'Professional Tables'
          }
        ],
        availability: {
          openTime: '07:00',
          closeTime: '22:00',
          weeklyOff: ['sunday']
        },
        pricing: {
          hourly: 200,
          currency: 'usd',
          peakHours: [
            {
              startTime: '18:00',
              endTime: '21:00',
              multiplier: 1.2
            }
          ]
        },
        rating: {
          average: 4.3,
          count: 14,
          breakdown: { 5: 8, 4: 4, 3: 2, 2: 0, 1: 0 }
        },
        contact: {
          phone: '9876543215',
          email: 'info@ttclub.com'
        },
        status: 'approved',
        isActive: true
      }
    ]);

    logger.info('Created venues');

    // Create courts for each venue
    const courts = [];
    
    for (const venue of venues) {
      const courtCount = venue.sports[0] === 'football' ? 1 : 
                        venue.sports[0] === 'cricket' ? 3 : 
                        venue.sports[0] === 'tennis' ? 2 : 4;
      
      for (let i = 1; i <= courtCount; i++) {
        const court = await Court.create({
          venue: venue._id,
          name: `${venue.sports[0].charAt(0).toUpperCase() + venue.sports[0].slice(1)} Court ${i}`,
          sport: venue.sports[0],
          type: venue.venueType === 'indoor' ? 'indoor' : 'outdoor',
          surface: venue.sports[0] === 'football' ? 'synthetic' :
                  venue.sports[0] === 'cricket' ? 'grass' :
                  venue.sports[0] === 'tennis' ? 'clay' : 'concrete',
          dimensions: {
            length: venue.sports[0] === 'football' ? 100 :
                   venue.sports[0] === 'cricket' ? 22 :
                   venue.sports[0] === 'tennis' ? 24 : 13.4,
            width: venue.sports[0] === 'football' ? 50 :
                  venue.sports[0] === 'cricket' ? 3 :
                  venue.sports[0] === 'tennis' ? 11 : 6.1,
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
            sunday: { isOpen: false, hours: [] }
          },
          isActive: true,
          totalBookings: Math.floor(Math.random() * 50) + 10,
          rating: {
            average: venue.rating.average - (Math.random() * 0.5),
            count: Math.floor(Math.random() * 20) + 5
          }
        });
        
        courts.push(court);
      }
      
      // Add courts to venue
      venue.courts = courts.filter(c => c.venue.toString() === venue._id.toString()).map(c => c._id);
      await venue.save();
    }

    logger.info('Created courts');

    // Seed sample bookings
    await seedBookings();

    logger.info('Seed data created successfully!');
    logger.info(`Created ${users.length} users`);
    logger.info(`Created ${venues.length} venues`);
    logger.info(`Created ${courts.length} courts`);

    return { users, venues, courts };
  } catch (error) {
    logger.error('Error seeding data:', error);
    throw error;
  }
};

module.exports = seedData;
