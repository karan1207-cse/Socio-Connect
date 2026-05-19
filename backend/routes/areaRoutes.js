const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/", (req, res) => {
  const search = req.query.search || "";

  const sql = `
    SELECT name 
    FROM areas 
    WHERE name LIKE ?
    ORDER BY name ASC
    LIMIT 10
  `;

  db.query(sql, [`%${search}%`], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching areas" });
    }

    res.json(result);
  });
});

module.exports = router;
