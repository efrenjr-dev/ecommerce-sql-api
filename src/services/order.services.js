const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { prisma } = require("../utils/prisma");
const logger = require("../config/logger");
const crypto = require("node:crypto");

const getOrderDetails = async (orderId) => {
    return await prisma.order_Details.findUnique({
        where: { id: orderId },
        include: {
            Order_Item: {
                include: { Product: true },
            },
        },
    });
};

const getOrders = async (userId) => {
    return await prisma.order_Details.findMany({
        where: { userId: userId },
        include: {
            Order_Item: true,
        },
    });
};

module.exports = { getOrderDetails, getOrders };
