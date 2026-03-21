const express = require("express");
const router  = express.Router();
const User    = require("../models/User");

const PLANS = {
  basic:    { name:"Basic",    price:99,  duration:30  },
  standard: { name:"Standard", price:199, duration:30  },
  premium:  { name:"Premium",  price:399, duration:30  },
};

// POST /subscription/subscribe  { userId, plan }
router.post("/subscribe", async (req, res) => {
  try {
    const { userId, plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const now       = new Date();
    const expiresAt = new Date(now.getTime() + PLANS[plan].duration * 24 * 60 * 60 * 1000);

    user.subscription = { plan, status: "active", startDate: now, expiresAt };
    await user.save();

    const { password, ...safe } = user.toObject();
    res.json({ message: "Subscription activated!", user: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /subscription/status/:userId
router.get("/status/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "Not found" });

    const sub = user.subscription;
    // Auto-expire check
    if (sub.status === "active" && sub.expiresAt && new Date() > sub.expiresAt) {
      user.subscription.status = "expired";
      await user.save();
    }

    res.json(user.subscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /subscription/cancel { userId }
router.post("/cancel", async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) return res.status(404).json({ error: "Not found" });
    user.subscription = { plan:"none", status:"none", startDate:null, expiresAt:null };
    await user.save();
    const { password, ...safe } = user.toObject();
    res.json({ message: "Subscription cancelled", user: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;