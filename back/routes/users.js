const router  = require('express').Router();
const Admin   = require('../models/Admin');
const Host    = require('../models/Host');
const EVOwner = require('../models/EVOwner');

// GET /api/user/all — admin: get all registered users (hosts + owners)
router.get('/all', async (req, res) => {
  try {
    const hosts   = await Host.find({});
    const owners  = await EVOwner.find({});
    
    // Combine and mark correctly
    const all = [
      ...hosts.map(u => ({ ...u._doc, type: 'host' })),
      ...owners.map(u => ({ ...u._doc, type: 'ev-owner' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, users: all });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/user/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check all collections since frontend might not pass the exact type here
    let user = await EVOwner.findById(id);
    if (!user) user = await Host.findById(id);
    if (!user) user = await Admin.findById(id);

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
      
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
