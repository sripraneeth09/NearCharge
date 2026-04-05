const router      = require('express').Router();
const Admin       = require('../models/Admin');
const Host        = require('../models/Host');
const EVOwner     = require('../models/EVOwner');
const Request     = require('../models/Request');

// GET /api/stats?type=admin|host|ev-owner&userId=xxx
router.get('/', async (req, res) => {
  try {
    const { type, userId } = req.query;

    if (type === 'admin') {
      const pending    = await Host.countDocuments({ status: 'pending' });
      const approved   = await Host.countDocuments({ status: 'approved' });
      const rejected   = await Host.countDocuments({ status: 'rejected' });
      const totalHosts = await Host.countDocuments();
      const totalOwners = await EVOwner.countDocuments();
      
      const sessions = await Request.find({ status: { $in: ['accepted', 'completed'] } }).populate('host');
      const totalEarnings = sessions.reduce((sum, r) => sum + (r.host?.price || 35), 0);

      return res.json({ success: true, stats: { 
        pending, approved, rejected, totalHosts, 
        totalUsers: totalHosts + totalOwners,
        totalEarnings 
      }});
    }

    if (type === 'host' && userId) {
      const host = await Host.findById(userId);
      if (!host) return res.status(404).json({ success: false, message: 'Host not found' });

      const allRequests = await Request.find({ host: userId, status: { $in: ['accepted', 'completed'] } });
      
      const now = new Date();
      const todayStart = new Date(new Date().setHours(0,0,0,0));
      const weekStart = new Date(new Date().setDate(now.getDate() - 7));
      const monthStart = new Date(new Date().setMonth(now.getMonth() - 1));

      const todayEarnings = allRequests
        .filter(r => new Date(r.createdAt) >= todayStart)
        .reduce((sum, r) => sum + (host.price || 35), 0);
      
      const weekEarnings = allRequests
        .filter(r => new Date(r.createdAt) >= weekStart)
        .reduce((sum, r) => sum + (host.price || 35), 0);
        
      const monthEarnings = allRequests
        .filter(r => new Date(r.createdAt) >= monthStart)
        .reduce((sum, r) => sum + (host.price || 35), 0);

      return res.json({ success: true, stats: {
        today: todayEarnings, 
        week: weekEarnings, 
        month: monthEarnings, 
        totalGuests: allRequests.length, 
        isActive: host.isActive
      }});
    }

    if (type === 'ev-owner' && userId) {
      const myRequests = await Request.find({ user: userId, status: { $in: ['accepted', 'completed'] } }).populate('host');
      const totalSpent = myRequests.reduce((sum, r) => sum + (r.host?.price || 35), 0);
      
      const uniqueHosts = new Set(myRequests.map(r => r.host?._id?.toString()).filter(Boolean));

      return res.json({ success: true, stats: { 
        totalCharges: myRequests.length, 
        totalSpent, 
        savedHosts: uniqueHosts.size 
      }});
    }

    res.status(400).json({ success: false, message: 'Invalid stats request' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
