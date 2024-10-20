const httpStatus = require("http-status");
const logger = require("../config/logger");
const catchAsync = require("../utils/catchAsync");
const { cartService } = require("../services");

const addToCart = catchAsync(async (req, res) => {
    logger.debug("CREATE CART CONTROLLER");
    if (req.user.role !== "user") {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "User role cannot have shopping cart."
        );
    }
    const cart = await cartService.addToCart(req.user.id, req.body);
    res.status(httpStatus.ACCEPTED).send(cart);
});

const getCart = catchAsync(async (req, res) => {
    logger.debug("GET CART CONTROLLER");
    const cart = await cartService.getCartItems(req.user.id);
    if (!cart) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "User does not have shopping cart."
        );
    }
    res.status(httpStatus.FOUND).send(cart);
});

const updateCartTotal = catchAsync(async (req, res) => {
    logger.debug("UPDATE CART TOTAL CONTROLLER");
});

module.exports = { addToCart, getCart };
