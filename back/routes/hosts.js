const router = require('express').Router();
const Host    = require('../models/Host');
const Request = require('../models/Request');

// GET /api/hosts — active hosts with optional filters
router.get('/', async (req, res) => {
  try {
    const { mode, chargerType } = req.query;
    let query = { status: 'approved', isActive: true };

    if (mode === 'need') {
      query.setup = 'provide';
      if (chargerType) query.chargerType = chargerType;
    }
    if (mode === 'own') {
      query.$or = [{ setup: 'own' }, { setup: 'provide' }];
    }

    // New: Exclude hosts that are currently in an active (accepted) charging session
    const activeRequests = await Request.find({ status: 'accepted' }).select('host');
    const occupiedHostIds = activeRequests.map(r => r.host?.toString()).filter(Boolean);
    if (occupiedHostIds.length > 0) {
      query._id = { $nin: occupiedHostIds };
    }

    const hosts = await Host.find(query).sort({ rating: -1 });
    res.json({ success: true, hosts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/hosts/pending — admin: get pending host users
router.get('/pending', async (req, res) => {
  try {
    const hosts = await Host.find({ status: 'pending' });
    res.json({ success: true, hosts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/hosts/toggle-active — host: toggle online/offline
router.patch('/toggle-active', async (req, res) => {
  try {
    const { userId, isActive } = req.body;
    // Now host owner relies on _id mapping
    const host = await Host.findByIdAndUpdate(userId, { isActive }, { new: true });
    if (!host)
      return res.status(404).json({ success: false, message: 'Host record not found' });
    res.json({ success: true, isActive: host.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/hosts/:id/approve — admin: approve host
router.patch('/:id/approve', async (req, res) => {
  try {
    const host = await Host.findByIdAndUpdate(req.params.id, { status: 'approved', isActive: true }, { new: true });
    if (!host)
      return res.status(404).json({ success: false, message: 'Host not found' });

    // Assuming missing fields default to some base standard to prevent frontend break
    if(!host.distance) host.distance = '0m';
    if(!host.price) host.price = 35;
    if(!host.rating) host.rating = 4.5;
    await host.save();

    res.json({ success: true, user: host });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/hosts/:id/reject — admin: reject host
router.patch('/:id/reject', async (req, res) => {
  try {
    const host = await Host.findByIdAndUpdate(req.params.id, { status: 'rejected', isActive: false }, { new: true });
    if (!host)
      return res.status(404).json({ success: false, message: 'Host not found' });

    res.json({ success: true, user: host });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
