const httpStatus = require("http-status");
const logger = require("../config/logger");
const { userService, cartService } = require("../services");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

const createUser = catchAsync(async (req, res, next) => {
    logger.debug("CREATE USER");
    const user = await userService.createUser(req.body);
    if (user.role === "user") await cartService.createCart(req.user.id);
    res.status(httpStatus.CREATED).send(user);
});

const getUser = catchAsync(async (req, res) => {
    logger.debug("GET USER");
    const user = await userService.getUserById(req.params.userId);
    delete user.password;
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    res.status(httpStatus.FOUND).send(user);
});

const getUsers = catchAsync(async (req, res) => {
    logger.debug("GET ALL USERS");
    const { searchString, skip, take } = req.query;
    const users = await userService.getUsers(searchString, skip, take);
    if (!users) {
        throw new ApiError(httpStatus.NOT_FOUND, "No users found");
    }
    res.status(httpStatus.FOUND).send(users);
});

const updateUser = catchAsync(async (req, res) => {
    logger.debug("UPDATE USER");
    const user = await userService.updateUser(req.params.userId, req.body);
    if (!user) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Unable to update user record"
        );
    }
    res.status(httpStatus.ACCEPTED).send(user);
});

module.exports = { createUser, getUser, getUsers: getUsers, updateUser };
