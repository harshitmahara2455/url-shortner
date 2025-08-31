const express = require("express");
const urlRoutes = require("./routes/url");
require("dotenv").config();
const connectDB = require("./config/db");
const app = express();
app.use(express.json());
connectDB(); 

app.use("/",urlRoutes)


setInterval(() => {
  db.cleanupExpiredUrls(30); // remove URLs older than 30 days
}, 3600000);



const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
    // Send a string as the response
    res.send('Front-end will be done soon ');
});




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
