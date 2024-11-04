const express = require("express");
const { auth } = require("../../middlewares/auth");
const { cartController } = require("../../controllers/");
const { userValidation } = require("../../validations");
const validator = require("express-joi-validation").createValidator({
    passError: true,
});

const router = express.Router();

router
    .route("/")
    .get(auth(), cartController.getCart)
    .put(auth("manageCart"), cartController.addToCart);

router
    .route("/item/:cartItemId")
    .patch(auth("manageCart"), cartController.updateCartItem)
    .delete(auth("manageCart"), cartController.removeFromCart);

router.post("/checkout", auth("manageCart"), cartController.checkout);

module.exports = router;
