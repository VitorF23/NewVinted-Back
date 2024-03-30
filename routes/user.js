const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  const { email, username, password, newsletter } = req.body;
  try {
    if (username === "" || email === "" || password === "") {
      return res.status(400).json({
        message:
          "All the necessary information is missing from the form Please complete all the fields in the form",
      });
    }

    const users = await User.findOne({ email: email });

    if (users) {
      return res.status(409).json({ message: "Email already exists" });
    } else {
      const salt = uid2(24);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(24);

      const signup = new User({
        account: {
          username: username,
        },
        email: email,
        token: token,
        hash: hash,
        salt: salt,
        newsletter: newsletter,
      });

      await signup.save();
      return res.status(200).json({
        _id: signup._id,
        token: signup.token,
        account: {
          username: signup.account.username,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json("Your email or password is missing");
    }
    const userFound = await User.findOne({ email: email });
    if (!userFound) {
      return res.status(400).json("Access Denied");
    }

    const receivedPassword = password;

    const saltedReceivedPassword = receivedPassword + userFound.salt;

    const newHash = SHA256(saltedReceivedPassword).toString(encBase64);

    if (newHash === userFound.hash) {
      return res.status(200).json({
        _id: userFound._id,
        token: userFound.token,
        account: {
          username: userFound.account.username,
        },
      });
    } else {
      return res.status(400).json("Access Denied");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
