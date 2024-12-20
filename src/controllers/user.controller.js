const httpStatus = require("http-status");
const logger = require("../config/logger");
const { userService, cartService } = require("../services");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

const createUser = catchAsync(async (req, res, next) => {
    logger.debug("CREATE USER");
    const user = await userService.createUser(req.body);
    if (user.role === "user") await cartService.createCart(user.id);
    res.status(httpStatus.CREATED).send(user);
});

const getUser = catchAsync(async (req, res) => {
    logger.debug("GET USER");
    const user = await userService.getUserById(req.params.userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    res.status(httpStatus.OK).send(user);
});

const getUserDetails = catchAsync(async (req, res) => {
    logger.debug("GET USER");
    const user = await userService.getUserById(req.user.id);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    res.status(httpStatus.OK).send(user);
});

const getUsers = catchAsync(async (req, res) => {
    logger.debug("GET ALL USERS");
    const { searchString, skip, take } = req.query;
    const { users, usersCount } = await userService.getUsers(
        searchString,
        skip,
        take,
        req.user.id
    );
    if (!users) {
        throw new ApiError(httpStatus.NOT_FOUND, "No users found");
    }
    const hasMore = parseInt(skip) + parseInt(take) < usersCount;
    res.status(httpStatus.OK).send({ users, usersCount, hasMore });
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

const updateProfile = catchAsync(async (req, res) => {
    logger.debug("UPDATE USER PROFILE");
    const user = await userService.updateUser(req.user.id, req.body);
    if (!user) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Unable to update user record"
        );
    }
    res.status(httpStatus.ACCEPTED).send(user);
});

module.exports = {
    createUser,
    getUser,
    getUsers,
    updateUser,
    getUserDetails,
    updateProfile,
};
