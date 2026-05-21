const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Helper: Update user reliability score
const updateReliability = (userId) => {
  const sql = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'attended' THEN 1 ELSE 0 END) AS attended
    FROM participants
    WHERE user_id = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) return;

    const total = result[0].total;
    const attended = result[0].attended || 0;

    const reliability =
      total === 0 ? 100 : Math.round((attended / total) * 100);

    const updateUserSql = `
      UPDATE users SET reliability = ? WHERE id = ?
    `;

    db.query(updateUserSql, [reliability, userId]);
  });
};

// Create Activity
router.post("/create", authenticateToken, (req, res) => {
  const { title, description, location, activity_time } = req.body;

  const sql = `
    INSERT INTO activities (title, description, location, activity_time, created_by)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [title, description, location, activity_time, req.user.id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error creating activity" });
    }

    res.json({ message: "Activity created successfully" });
  });
});

// Get All Activities (location-based)
router.get("/", authenticateToken, (req, res) => {
  const userSql = "SELECT area FROM users WHERE id = ?";
  db.query(userSql, [req.user.id], (err, userResult) => {
    if (err || userResult.length === 0) {
      return res.status(500).json({ message: "Error fetching user area" });
    }
    const userArea = userResult[0].area;

    const sql = `
      SELECT 
        activities.*, 
        users.name,
        users.reliability,
        (
          SELECT COUNT(*) 
          FROM participants 
          WHERE participants.activity_id = activities.id
        ) AS participants_count,
        EXISTS (
          SELECT 1 FROM participants
          WHERE participants.activity_id = activities.id
          AND participants.user_id = ?
        ) AS joined
      FROM activities
      JOIN users ON activities.created_by = users.id
      WHERE activities.location = ?
      ORDER BY activities.created_at DESC
    `;

    db.query(sql, [req.user.id, userArea], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error fetching activities" });
      }

      res.json(result);
    });
  });
});

// Join Activity
router.post("/join/:id", authenticateToken, (req, res) => {
  const activityId = req.params.id;
  const userId = req.user.id;

  const checkSql = `SELECT activity_time FROM activities WHERE id = ?`;

  db.query(checkSql, [activityId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error checking activity" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const activityTime = new Date(result[0].activity_time);
    const now = new Date();

    if (activityTime < now) {
      return res.status(400).json({ message: "Activity already expired" });
    }

    const insertSql = `INSERT INTO participants (user_id, activity_id) VALUES (?, ?)`;

    db.query(insertSql, [userId, activityId], (err2) => {
      if (err2) {
        return res.status(400).json({ message: "Already joined or error occurred" });
      }

      res.json({ message: "Joined activity successfully" });
    });
  });
});

// Get Participants
router.get("/:id/participants", authenticateToken, (req, res) => {
  const activityId = req.params.id;

  const sql = `
    SELECT users.id, users.name, participants.status
    FROM participants
    JOIN users ON participants.user_id = users.id
    WHERE participants.activity_id = ?
  `;

  db.query(sql, [activityId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching participants" });
    }

    res.json(result);
  });
});

// Leave Activity
router.delete("/leave/:id", authenticateToken, (req, res) => {
  const activityId = req.params.id;
  const userId = req.user.id;
  const sql = `DELETE FROM participants WHERE user_id = ? AND activity_id = ?`;

  db.query(sql, [userId, activityId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error leaving activity" });
    }
    res.json({ message: "Left activity successfully" });
  });
});

// Mark Attendance
router.post("/mark-attendance/:activityId", authenticateToken, (req, res) => {
  const { userId, status } = req.body;
  const activityId = req.params.activityId;

  const checkSql = `SELECT created_by, activity_time FROM activities WHERE id = ?`;

  db.query(checkSql, [activityId], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.length === 0)
      return res.status(404).json({ message: "Activity not found" });

    if (result[0].created_by !== req.user.id)
      return res.status(403).json({ message: "Only creator can mark attendance" });

    const activityTime = new Date(result[0].activity_time);
    const now = new Date();

    if (activityTime > now) {
      return res.status(400).json({
        message: "Cannot mark attendance before activity time",
      });
    }

    const updateSql = `
      UPDATE participants SET status = ? WHERE user_id = ? AND activity_id = ?
    `;

    db.query(updateSql, [status, userId, activityId], (err2) => {
      if (err2)
        return res.status(500).json({ message: "Error updating attendance" });

      updateReliability(userId);
      res.json({ message: "Attendance updated" });
    });
  });
});

// Edit Activity (only creator, only if not yet passed)
router.put("/edit/:id", authenticateToken, (req, res) => {
  const activityId = req.params.id;
  const { title, description, location, activity_time } = req.body;

  const checkSql = `SELECT created_by, activity_time FROM activities WHERE id = ?`;

  db.query(checkSql, [activityId], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.length === 0)
      return res.status(404).json({ message: "Activity not found" });

    if (result[0].created_by !== req.user.id)
      return res.status(403).json({ message: "Only creator can edit activity" });

    const activityTime = new Date(result[0].activity_time);
    const now = new Date();

    if (activityTime < now) {
      return res.status(400).json({ message: "Cannot edit an expired activity" });
    }

    const updateSql = `
      UPDATE activities 
      SET title = ?, description = ?, location = ?, activity_time = ?
      WHERE id = ?
    `;

    const formattedTime = activity_time || result[0].activity_time;

    db.query(updateSql, [title, description, location, formattedTime, activityId], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ message: "Error updating activity" });
      }

      res.json({ message: "Activity updated successfully" });
    });
  });
});

// Delete Activity (only creator)
router.delete("/delete/:id", authenticateToken, (req, res) => {
  const activityId = req.params.id;

  const checkSql = `SELECT created_by FROM activities WHERE id = ?`;

  db.query(checkSql, [activityId], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.length === 0)
      return res.status(404).json({ message: "Activity not found" });

    if (result[0].created_by !== req.user.id)
      return res.status(403).json({ message: "Only creator can delete activity" });

    // Delete participants first, then delete the activity
    const deleteParticipantsSql = `DELETE FROM participants WHERE activity_id = ?`;

    db.query(deleteParticipantsSql, [activityId], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ message: "Error deleting participants" });
      }

      const deleteActivitySql = `DELETE FROM activities WHERE id = ?`;

      db.query(deleteActivitySql, [activityId], (err3) => {
        if (err3) {
          console.error(err3);
          return res.status(500).json({ message: "Error deleting activity" });
        }

        res.json({ message: "Activity deleted successfully" });
      });
    });
  });
});

module.exports = router;
