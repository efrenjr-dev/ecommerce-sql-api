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
            User: {
                select: {
                    name: true,
                },
            },
        },
    });
};

const getOrders = async (userId, skip, take) => {
    return await prisma.order_Details.findMany({
        where: { userId: userId },
        skip: parseInt(skip),
        take: parseInt(take),
    });
};

const getAllOrders = async (skip, take) => {
    return await prisma.order_Details.findMany({
        include: {
            Order_Item: true,
        },
        skip: parseInt(skip),
        take: parseInt(take),
        // where: {
        //     OR: [{ name: { contains: searchString, mode: "insensitive" } }],
        // },
        orderBy: {
            createdAt: "desc",
        },
    });
};

module.exports = { getOrderDetails, getOrders, getAllOrders };
