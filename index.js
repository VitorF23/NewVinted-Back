require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  res.json("Welcome to Vinted🙋‍♀️");
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
const payment = require("./routes/payment");
app.use(userRoutes);
app.use(offerRoutes);
app.use(payment);

app.all("*", (req, res) => {
  res.status(500).json("Route not Found");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🔥Serveur has started🔥");
});
