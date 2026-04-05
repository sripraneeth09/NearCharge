const mongoose = require('mongoose');

const hostSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String }, // For login
  password:    { type: String }, // For login
  phone:       String,
  type:        { type: String, default: 'host' },
  location:    String,
  lat:         Number,
  lng:         Number,
  socket:      String,
  setup:       String,
  chargerType: String,
  distance:    String,
  price:       { type: Number, default: 35 },
  rating:      { type: Number, default: 4.5 },
  status:      { type: String, default: 'approved' },
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now }
}, { collection: 'hosts' });

module.exports = mongoose.model('Host', hostSchema);
