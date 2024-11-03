const httpStatus = require("http-status");
const logger = require("../config/logger");
const { orderService } = require("./../services");
const catchAsync = require("../utils/catchAsync");

const getOrderDetails = catchAsync(async (req, res) => {
    logger.debug("GET ORDER DETAILS CONTROLLER");
    const order = await orderService.getOrderDetails(req.params.orderId);
    res.status(httpStatus.OK).send(order);
});

const getOrders = catchAsync(async (req, res) => {
    logger.debug("GET ORDER DETAILS CONTROLLER");
    const orders = await orderService.getOrders(req.user.id);
    res.status(httpStatus.OK).send(orders);
});

module.exports = { getOrderDetails, getOrders };
