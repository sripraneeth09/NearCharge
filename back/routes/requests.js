const router  = require('express').Router();
const Request = require('../models/Request');
const Host    = require('../models/Host');

// POST /api/requests — EV owner creates a charging request
router.post('/', async (req, res) => {
  try {
    const { userId, hostId, vehicleType, currentBattery, targetBattery } = req.body;
    if (!userId || !hostId || !vehicleType || !currentBattery || !targetBattery)
      return res.status(422).json({ success: false, message: 'Missing request data' });

    const reqObj = await Request.create({
      user: userId, host: hostId, vehicleType, currentBattery, targetBattery, 
      status: 'pending', isAccepted: false
    });
    res.json({ success: true, request: reqObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/requests — EV owner: fetch all their requests (active first)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId)
      return res.status(422).json({ success: false, message: 'Missing userId' });

    const requests = await Request.find({ user: userId })
      .populate('host')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/requests/host — host: pending + recent sessions
router.get('/host', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId)
      return res.status(422).json({ success: false, message: 'Missing userId' });

    const host = await Host.findById(userId);
    if (!host) return res.json({ success: true, pending: [], recent: [] });

    // Pending requests for this host
    const pending = await Request.find({ host: host._id, status: 'pending' })
      .populate('user').sort({ createdAt: 1 });
    
    // Recent / Active / Completed sessions for this host
    const recent  = await Request.find({ host: host._id, status: { $in: ['accepted', 'started', 'completed', 'rejected'] } })
      .populate('user').sort({ createdAt: -1 });

    res.json({ success: true, pending, recent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/requests/status/:id — get status of a single request
router.get('/status/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const request = await Request.findById(id).populate('host');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    
    // Recovery Logic: If status is accepted but OTP missed for some reason, generate it now
    if (request.status === 'accepted' && !request.otp) {
      request.otp = Math.floor(1000 + Math.random() * 9000).toString();
      await request.save();
    }

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/requests/:id/status — host: accept or reject; owner: cancel
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    let updateFields = { status };

    if (status === 'accepted') {
      updateFields.isAccepted = true;
      // Generate unique 4-digit numeric OTP
      updateFields.otp = Math.floor(1000 + Math.random() * 9000).toString();
    } else if (status === 'cancelled' || status === 'rejected') {
      updateFields.isAccepted = false;
    }

    const reqObj = await Request.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    res.json({ success: true, request: reqObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/requests/:id/verify-otp — host: verify guest OTP to START session
router.patch('/:id/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    
    if (request.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    request.status = 'started';
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
