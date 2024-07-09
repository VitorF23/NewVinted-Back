const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    const userToken = req.headers.authorization.replace("Bearer ", "");
    console.log("Token reçu:", userToken);

    const user = await User.findOne({ token: userToken }).select("account");
    console.log("Utilisateur trouvé:", user);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      req.user = user;
      return next();
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = isAuthenticated;
