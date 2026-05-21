const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Get current user's profile
router.get("/profile", authenticateToken, (req, res) => {
  const sql = `
    SELECT 
      u.id, u.name, u.email, u.area, u.age, u.reliability, u.created_at,
      (SELECT COUNT(*) FROM activities WHERE created_by = u.id) AS total_created,
      (SELECT COUNT(*) FROM participants WHERE user_id = u.id) AS total_joined,
      (SELECT COUNT(*) FROM participants WHERE user_id = u.id AND status = 'attended') AS total_attended
    FROM users u
    WHERE u.id = ?
  `;

  db.query(sql, [req.user.id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching profile" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result[0]);
  });
});

// Get activities created by current user
router.get("/my-activities", authenticateToken, (req, res) => {
  const sql = `
    SELECT 
      activities.*,
      (SELECT COUNT(*) FROM participants WHERE participants.activity_id = activities.id) AS participants_count
    FROM activities
    WHERE created_by = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [req.user.id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching created activities" });
    }
    res.json(result);
  });
});

// Get activities the current user has joined
router.get("/joined-activities", authenticateToken, (req, res) => {
  const sql = `
    SELECT 
      activities.*,
      users.name AS creator_name,
      participants.status,
      participants.joined_at
    FROM participants
    JOIN activities ON participants.activity_id = activities.id
    JOIN users ON activities.created_by = users.id
    WHERE participants.user_id = ?
    ORDER BY participants.joined_at DESC
  `;

  db.query(sql, [req.user.id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching joined activities" });
    }
    res.json(result);
  });
});

module.exports = router;
