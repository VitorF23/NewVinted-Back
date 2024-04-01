const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offer");
const router = express.Router();
const isAunthenticated = require("../middleware/isAuthenticated");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offer/publish",
  isAunthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      if (title.length > 50) {
        return res
          .status(400)
          .json("The number of characters is limited to 50");
      }
      if (description.length > 500) {
        return res
          .status(400)
          .json("tThe number of characters is limited to 500");
      }
      if (price >= 100000) {
        return res
          .status(400)
          .json("The price of the product is limited to 100 000 euros");
      }

      const newoffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { marque: brand },
          { taille: size },
          { état: condition },
          { couleur: color },
          { city: city },
        ],
        owner: req.user,
      });
      if (req.files) {
        const convertedPicture = convertToBase64(req.files.picture);
        const uploadResult = await cloudinary.uploader.upload(
          convertedPicture,
          {
            folder: `/vinted/offers/${newoffer._id}`,
          }
        );
        newoffer.product_image = uploadResult;
      }
      await newoffer.save();
      return res.json(newoffer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    console.log(req.query);

    const { title, priceMin, priceMax, sort } = req.query;

    const filters = {};

    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin) {
      filters.product_price = { $gte: Number(priceMin) };
    }
    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(priceMax);
      } else {
        filters.product_price = {
          $lte: Number(priceMax),
        };
      }
    }

    const priceSort = {};

    if (sort) {
      if (sort === "price-desc") {
        const sort = "desc";
        priceSort.product_price = sort;
      } else if (sort === "price-asc") {
        const sort = "asc";
        priceSort.product_price = sort;
      }
    }

    let limit = 5;
    if (req.query.limit) {
      limit = req.query.limit;
    }
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const skip = (page - 1) * limit;

    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(priceSort)
      .limit(limit)
      .skip(skip);

    const count = await Offer.countDocuments(filters);

    return res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    if (offer) {
      return res.status(200).json(offer);
    } else {
      return res.status(400).json("Not found id");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/offer/:id", isAunthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const deleteOffer = await Offer.findByIdAndDelete(id);
    if (deleteOffer) {
      return res
        .status(200)
        .json({ message: "Your offer has been successfully deleted" });
    } else {
      return res.status(400).json({ message: "The offer does not exist" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put(
  "/offer/modify/:id",
  isAunthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      if (
        !title ||
        !description ||
        !price ||
        !condition ||
        !city ||
        !brand ||
        !size ||
        !color
      ) {
        return res
          .status(400)
          .json({
            message: "Missing parameters.Please complete all the fields",
          });
      }
      const id = req.params.id;
      const modifiedOffer = await Offer.findByIdAndUpdate(id);

      if (!modifiedOffer) {
        return res.status(400).json({ message: "Offer not Found" });
      }
      modifiedOffer.product_name = title;
      modifiedOffer.product_description = description;
      modifiedOffer.product_price = price;
      modifiedOffer.product_details = [
        { marque: brand },
        { taille: size },
        { état: condition },
        { couleur: color },
        { city: city },
      ];

      await modifiedOffer.save();
      return res.status(200).json({ message: "Your offer has been changed" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
