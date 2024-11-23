const express = require("express");
const { auth } = require("../../middlewares/auth");
const { userController } = require("../../controllers/");
const { userValidation } = require("../../validations");
const validator = require("express-joi-validation").createValidator({
    passError: true,
});

const router = express.Router();

router.route("/all").get(auth("getUsers"), userController.getUsers);

router
    .route("/profile")
    .patch(
        auth(),
        validator.body(userValidation.updateUser),
        userController.updateProfile
    );

router
    .route("/:userId")
    .get(
        auth("getUsers"),
        validator.params(userValidation.paramsUserId),
        userController.getUser
    )
    .patch(
        auth("manageUsers"),
        validator.params(userValidation.paramsUserId),
        validator.body(userValidation.updateUser),
        userController.updateUser
    );

router
    .route("/")
    .get(auth(), userController.getUserDetails)
    .post(
        auth("manageUsers"),
        validator.body(userValidation.createUser),
        userController.createUser
    );

module.exports = router;
