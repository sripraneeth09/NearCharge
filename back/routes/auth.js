const router = require('express').Router();
const Admin   = require('../models/Admin');
const Host    = require('../models/Host');
const EVOwner = require('../models/EVOwner');

// POST /api/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, type, address, socketType, setupType, chargerType, lat, lng } = req.body;
    if (!name || !email || !password || !type)
      return res.status(422).json({ success: false, message: 'Missing required fields' });

    // Ensure email is unique across the entire platform
    const inAdmin   = await Admin.findOne({ email });
    const inHost    = await Host.findOne({ email });
    const inEVOwner = await EVOwner.findOne({ email });

    if (inAdmin || inHost || inEVOwner) {
      return res.status(409).json({ success: false, message: 'This email is already in use' });
    }

    let user = null;
    if (type === 'ev-owner') {
      user = await EVOwner.create({ name, phone, email, password, type });
    } else if (type === 'host') {
      user = await Host.create({
        name, phone, email, password, type,
        location: address, lat, lng,
        socket: socketType, setup: setupType, chargerType: chargerType || '',
        status: 'pending', isActive: false
      });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, type } = req.body;
    if (!email || !password || !type)
      return res.status(422).json({ success: false, message: 'Missing login fields' });

    let user = null;
    const query = { $or: [{ email: email }, { phone: email }], password: password };
    
    if (type === 'admin') user = await Admin.findOne({ email, password });
    else if (type === 'host') user = await Host.findOne(query);
    else if (type === 'ev-owner') user = await EVOwner.findOne(query);

    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
