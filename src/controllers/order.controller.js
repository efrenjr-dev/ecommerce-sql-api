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
    logger.debug("GET USER ORDERS CONTROLLER");
    const { skip, take } = req.query;
    const { orders, ordersCount } = await orderService.getOrders(
        req.user.id,
        skip,
        take
    );
    const hasMore = parseInt(skip) + parseInt(take) < ordersCount;
    // console.log("hasMore:", hasMore, "=", skip, "+", take, "<", ordersCount);
    res.status(httpStatus.OK).send({ orders, ordersCount, hasMore });
});

const getAllOrders = catchAsync(async (req, res) => {
    logger.debug("GET ALL ORDERS CONTROLLER");
    const { skip, take } = req.query;
    const { orders, ordersCount } = await orderService.getAllOrders(skip, take);
    const hasMore = parseInt(skip) + parseInt(take) < ordersCount;
    // console.log("hasMore:", hasMore, "=", skip, "+", take, "<", ordersCount);
    res.status(httpStatus.OK).send({ orders, ordersCount, hasMore });
});

module.exports = { getOrderDetails, getOrders, getAllOrders };
