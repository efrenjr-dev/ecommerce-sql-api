const httpStatus = require("http-status");
const logger = require("../config/logger");
const catchAsync = require("../utils/catchAsync");
const { cartService } = require("../services");
const { http } = require("winston");

const addToCart = catchAsync(async (req, res) => {
    logger.debug("CREATE CART CONTROLLER");
    if (req.user.role !== "user") {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "User role cannot have shopping cart."
        );
    }
    const updatedCart = await cartService.addToCart(req.user.id, req.body);
    res.status(httpStatus.OK).send(updatedCart);
});

const getCart = catchAsync(async (req, res) => {
    logger.debug("GET CART CONTROLLER");
    const cart = await cartService.getCart(req.user.id);
    if (!cart) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "User does not have shopping cart."
        );
    }
    res.status(httpStatus.OK).send(cart);
});

const removeFromCart = catchAsync(async (req, res) => {
    logger.debug("REMOVE FROM CART CONTROLLER");
    const updatedCart = await cartService.removeFromCart(
        req.user.id,
        req.params.cartItemId
    );
    res.status(httpStatus.OK).send(updatedCart);
});

const checkout = catchAsync(async (req, res) => {
    logger.debug("CHECKOUT CONTROLLER");
    const mockBody = { provider: "BISA" };
    const order = await cartService.checkout(req.user.id, mockBody);
    res.status(httpStatus.OK).send(order);
});

module.exports = { addToCart, getCart, removeFromCart, checkout };
