const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
    const { name, email, password, area, age } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, email, password, area, age)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(sql, [name, email, hashedPassword, area, age], (err) => {
            if (err) {
                console.error(err);
                return res.status(400).json({ message: "User already exists or error" });
            }

            res.json({ message: "User registered successfully" });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Login
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, result) => {
        if (err) return res.status(500).json({ message: "Server error" });

        if (result.length === 0)
            return res.status(400).json({ message: "Invalid email or password" });

        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch)
            return res.status(400).json({ message: "Invalid password" });

        const token = jwt.sign(
            { id: user.id, email: user.email },
            "SECRET_KEY",
            { expiresIn: "1h" }
        );

        res.json({ message: "Login successful", token });
    });
});

module.exports = router;
