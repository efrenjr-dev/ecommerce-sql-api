const express = require("express");
const { auth } = require("../../middlewares/auth");
const { productController } = require("../../controllers/");
const { userValidation } = require("../../validations");
const validator = require("express-joi-validation").createValidator({
    passError: true,
});

const router = express.Router();

router.route("/").get(productController.createProduct);

module.exports = router;
