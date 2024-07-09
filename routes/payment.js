const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_CLE_SECRET);
const router = express.Router();

router.post("/payment", async (req, res) => {
  try {
    const stripeToken = req.body.stripeToken;

    const price = parseFloat(req.body.price);

    const { title } = req.body;

    const amount = Math.round(price * 100).toFixed(0);

    const response = await stripe.charges.create({
      amount: amount,
      currency: "eur",
      description: title,
      source: stripeToken,
    });
    console.log(response.status);

    res.json(response);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
