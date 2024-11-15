const express = require("express");
const { auth } = require("../../middlewares/auth");
const { productController } = require("../../controllers/");
const { productValidation } = require("../../validations");
const validator = require("express-joi-validation").createValidator({
    passError: true,
});

const router = express.Router();

router
    .route("/")
    .get(productController.getProducts)
    .post(
        auth("manageProducts"),
        validator.body(productValidation.createProduct),
        productController.createProduct
    );

router
    .route("/product/:productId")
    .get(productController.getProduct)
    .patch(
        auth("manageProducts"),
        validator.body(productValidation.updateProduct),
        productController.updateProduct
    );

router.get("/all", auth("getProducts"), productController.getAllProducts);

router.patch(
    "/consume",
    auth("manageInventory"),
    validator.body(productValidation.updateStock),
    productController.consumeStock
);
router.patch(
    "/replenish",
    auth("manageInventory"),
    validator.body(productValidation.updateStock),
    productController.replenishStock
);

module.exports = router;
