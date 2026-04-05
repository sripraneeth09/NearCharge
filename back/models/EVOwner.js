const mongoose = require('mongoose');

const evOwnerSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  password: { type: String, required: true },
  phone:    String,
  type:     { type: String, default: 'ev-owner' },
  createdAt:{ type: Date, default: Date.now }
}, { collection: 'ev_owners' });

module.exports = mongoose.model('EVOwner', evOwnerSchema);
