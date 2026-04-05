const Admin   = require('../models/Admin');
const Host    = require('../models/Host');
const EVOwner = require('../models/EVOwner');
const Request = require('../models/Request');

async function seedAdmin() {
  const existing = await Admin.findOne({ email: 'admin@nearcharge.com' });
  if (existing) return;
  await Admin.create({
    name: 'Super Admin',
    email: 'admin@nearcharge.com',
    password: 'admin123',
    type: 'admin'
  });
  console.log('Seeded default admin: admin@nearcharge.com / admin123');
}

async function seedHosts() {
  const check = await Host.findOne({ email: 'jag@host.com' });
  if (check) return;

  const base = [
    { name: 'Rahul Kumar', email: 'rahul@host.com', password: 'password123', phone: '9876543210', location: 'Koramangala, Bangalore', socket: '5a',  setup: 'own',     chargerType: '',      distance: '150m', price: 25, rating: 4.9, status: 'approved', isActive: true },
    { name: 'Priya Singh', email: 'priya@host.com', password: 'password123', phone: '9876543211', location: 'Indiranagar, Bangalore',  socket: '15a', setup: 'provide', chargerType: 'type2', distance: '300m', price: 45, rating: 4.8, status: 'approved', isActive: true },
    { name: 'Srikanth Auto', email: 'sri@host.com', password: 'password123', phone: '9988776611', location: 'Kurmannapalem, Visakhapatnam', lat: 17.6585, lng: 83.1558, socket: '15a', setup: 'provide', chargerType: 'ccs2', distance: '1.2km', price: 50, rating: 4.9, status: 'approved', isActive: true },
    { name: 'Gajuwaka Hub', email: 'gajuwaka@host.com', password: 'password123', phone: '9988776622', location: 'Gajuwaka, Visakhapatnam', lat: 17.6917, lng: 83.1663, socket: '5a', setup: 'own', chargerType: '', distance: '2.5km', price: 30, rating: 4.6, status: 'approved', isActive: true },
    { name: 'Duvvada EV', email: 'duvvada@host.com', password: 'password123', phone: '9988776633', location: 'Duvvada Railway Station', lat: 17.6997, lng: 83.1492, socket: '15a', setup: 'provide', chargerType: 'type2', distance: '1.5km', price: 40, rating: 4.7, status: 'approved', isActive: true },
    { name: 'Jaggayyapalem EV', email: 'jag@host.com', password: 'password123', phone: '9988776644', location: 'Jaggayyapalem, Visakhapatnam', lat: 17.7172, lng: 83.1985, socket: '15a', setup: 'provide', chargerType: 'ccs2', distance: '500m', price: 55, rating: 5.0, status: 'approved', isActive: true },
    { name: 'Tungalam Station', email: 'tun@host.com', password: 'password123', phone: '9988776655', location: 'Tungalam, Visakhapatnam', lat: 17.7394, lng: 83.3076, socket: '15a', setup: 'provide', chargerType: 'type2', distance: '1km', price: 45, rating: 4.8, status: 'approved', isActive: true }
  ];
  await Host.insertMany(base);
  console.log('Seeded more Vizag hosts near Jaggayyapalem/Tungalam');
}

async function seedEVOwners() {
  const count = await EVOwner.countDocuments();
  if (count > 0) return;
  const base = [
    { name: 'Anjali Sharma', email: 'anjali@ev.com', password: 'password123', phone: '9988776655', type: 'ev-owner' },
    { name: 'Vikram Singh',  email: 'vikram@ev.com', password: 'password123', phone: '9988776656', type: 'ev-owner' },
  ];
  await EVOwner.insertMany(base);
  console.log('Seeded sample EV Owners');
}

async function seedRequests() {
  const count = await Request.countDocuments();
  if (count > 0) return;
  // This just ensures the collection is initialized in Compass immediately even if empty
  console.log('Requests collection verified/ready in MongoDB Compass');
}

module.exports = { seedAdmin, seedHosts, seedEVOwners, seedRequests };
