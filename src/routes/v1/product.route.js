const express = require("express");

const { auth } = require("../../middlewares/auth");
const { productController } = require("../../controllers/");
const { productValidation } = require("../../validations");
const { upload } = require("../../middlewares/upload");
const json = require("superjson");
const validator = require("express-joi-validation").createValidator({
    passError: true,
});

const router = express.Router();

router
    .route("/")
    .get(productController.getProducts)
    .post(
        auth("manageProducts"),
        upload.array("images", 5),
        validator.body(productValidation.createProduct),
        productController.createProduct
    );

router
    .route("/product/:productId")
    .get(productController.getProduct)
    .patch(
        auth("manageProducts"),
        upload.array("newImages", 5),
        (req, res, next) => {
            req.body.existingImages = req.body.existingImages
                ? json.parse(req.body.existingImages)
                : [];
            next();
        },
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
