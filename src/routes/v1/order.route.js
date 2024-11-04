const express = require("express");
const { auth } = require("../../middlewares/auth");
const { orderController } = require("../../controllers/");
const { userValidation } = require("../../validations");
const validator = require("express-joi-validation").createValidator({
    passError: true,
});

const router = express.Router();

router.route("/all").get(auth("getOrders"), orderController.getAllOrders);
router.route("/").get(auth(), orderController.getOrders);
router.route("/order/:orderId").get(auth(), orderController.getOrderDetails);

module.exports = router;
