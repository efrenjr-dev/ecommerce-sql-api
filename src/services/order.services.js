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
                include: {
                    Product: {
                        include: {
                            Image: {
                                select: {
                                    url: true,
                                },
                                take: 1,
                                orderBy: {
                                    created_at: "asc",
                                },
                            },
                        },
                    },
                },
            },
            User: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};

const getOrders = async (userId, skip, take) => {
    const orders = await prisma.order_Details.findMany({
        where: { userId: userId },
        skip: parseInt(skip),
        take: parseInt(take),
        orderBy: {
            createdAt: "desc",
        },
    });
    const ordersCount = await prisma.order_Details.count({
        where: { userId: userId },
    });
    return { orders, ordersCount };
};

const getAllOrders = async (skip, take) => {
    const orders = await prisma.order_Details.findMany({
        include: {
            Order_Item: true,
        },
        skip: parseInt(skip),
        take: parseInt(take),
        orderBy: {
            createdAt: "desc",
        },
    });
    const ordersCount = await prisma.order_Details.count({});

    return { orders, ordersCount };
};

module.exports = { getOrderDetails, getOrders, getAllOrders };
