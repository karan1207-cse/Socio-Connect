const express = require('express');
const cors = require('cors');

require("./config/db");

const authRoutes = require("./routes/authRoutes");
const activityRoutes = require("./routes/activityRoutes");
const authenticateToken = require("./middleware/authMiddleware");
const areaRoutes = require("./routes/areaRoutes");

const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use("/api/areas", areaRoutes);

app.get('/', (_req, res) => {
    res.send('Socio-connect running');
});



app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
