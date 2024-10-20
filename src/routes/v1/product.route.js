const express = require("express");
const { auth } = require("../../middlewares/auth");
const { productController } = require("../../controllers/");
const { userValidation } = require("../../validations");
const validator = require("express-joi-validation").createValidator({
    passError: true,
});

const router = express.Router();

router
    .route("/")
    .get(productController.getProducts)
    .post(productController.createProduct);

router
    .route("/product/:productId")
    .get(productController.getProduct)
    .patch(productController.updateProduct);

router.patch("/consume", productController.consumeStock);
router.patch("/replenish", productController.replenishStock);

module.exports = router;
