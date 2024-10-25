const express = require("express");
const { auth } = require("../../middlewares/auth");
const { orderController } = require("../../controllers/");
const { userValidation } = require("../../validations");
const validator = require("express-joi-validation").createValidator({
    passError: true,
});

const router = express.Router();

router.route("/:orderId").get(orderController.getOrderDetails);
router.route("/").get(orderController.getOrders);

module.exports = router;