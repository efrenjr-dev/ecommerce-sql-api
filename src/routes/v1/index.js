const express = require("express");
const userRoute = require("./user.route");
const authRoute = require("./auth.route");
const productRoute = require("./product.route");
const cartRoute = require("./cart.route");
const orderRoute = require("./order.route");
const httpStatus = require("http-status");

const router = express.Router();

router.use("/users", userRoute);
router.use("/auth", authRoute);
router.use("/products", productRoute);
router.use("/carts", cartRoute);
router.use("/orders", orderRoute);

router.get("/", (req, res) => {
    res.status(httpStatus.OK).send("eCommerce API");
});

module.exports = router;
