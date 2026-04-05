const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user:           { type: mongoose.Types.ObjectId, ref: 'EVOwner' },
  host:           { type: mongoose.Types.ObjectId, ref: 'Host' },
  vehicleType:    String,
  currentBattery: Number,
  targetBattery:  Number,
  otp:            String,
  status:         { type: String, enum: ['pending', 'accepted', 'started', 'completed', 'rejected', 'cancelled'], default: 'pending' },
  isAccepted:     { type: Boolean, default: false },
  createdAt:      { type: Date, default: Date.now }
}, { collection: 'requests' });

module.exports = mongoose.model('Request', requestSchema);
