const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { prisma, xprisma } = require("../utils/prisma");
const logger = require("../config/logger");
const crypto = require("node:crypto");
const productService = require("./product.services");
const { empty } = require("@prisma/client/runtime/library");

const createCart = async (userId) => {
    const cart = await prisma.shopping_Session.create({
        data: {
            userId: userId,
        },
    });
};

const addToCart = async (userId, updateBody) => {
    let modifiedItem;
    const cart = await getCart(userId);

    const foundCartItem = cart.Cart_Item.find((cartItem) => {
        // logger.debug(`${cartItem.Product.id} === ${updateBody.productId}?`);
        // logger.debug(cartItem.Product.id === updateBody.productId);
        return cartItem.Product.id === updateBody.productId;
    });
    if (foundCartItem) {
        modifiedItem = await prisma.cart_Item.update({
            where: { id: foundCartItem.id },
            data: { ...updateBody },
        });
    } else {
        modifiedItem = await prisma.cart_Item.create({
            data: {
                sessionId: cart.id,
                ...updateBody,
            },
        });
    }
    await updateCartTotal(userId);
    return modifiedItem;
};

const removeFromCart = async (userId, cartItemId) => {
    const deletedItem = await prisma.cart_Item.delete({
        where: { id: cartItemId },
    });
    await updateCartTotal(userId);
    return deletedItem;
};

const updateCartTotal = async (userId) => {
    const cart = await getCart(userId);
    logger.debug(`cart: ${cart.id}`);

    let total = 0;
    cart.Cart_Item.forEach((cartItem) => {
        total += cartItem.quantity * cartItem.Product.price;
    });

    const updatedCart = await prisma.shopping_Session.update({
        where: { userId: userId },
        data: {
            total: total,
        },
        select: {
            total: true,
        },
    });
    return updatedCart;
};

const getCart = async (userId) => {
    const cart = await prisma.shopping_Session.findUnique({
        where: { userId: userId },
        select: {
            id: true,
            total: true,
            Cart_Item: {
                select: {
                    id: true,
                    quantity: true,
                    Product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            description: true,
                        },
                    },
                },
            },
        },
    });

    return cart;
};

const checkout = async (userId, body) => {
    const cart = await getCart(userId);
    for (cartItem of cart.Cart_Item) {
        await productService.consumeStock(
            cartItem.Product.id,
            cartItem.quantity
        );
    }

    const paymentDetails = await mockPayment(cart.total, body.provider);

    //if payment fails
    if (
        ["refunded", "canceled", "failed", "reversed"].includes(
            paymentDetails.status
        )
    ) {
        for (cartItem of cart.Cart_Item) {
            await productService.replenishStock(
                cartItem.Product.id,
                cartItem.quantity
            );
        }
        throw new ApiError(httpStatus.PAYMENT_REQUIRED, "Payment failed.");
    }

    const orderDetails = await createOrder(
        userId,
        paymentDetails.id,
        cart.total
    );

    await prisma.payment_Details.update({
        where: {
            id: paymentDetails.id,
        },
        data: {
            orderId: orderDetails.id,
        },
    });

    for (cartItem of cart.Cart_Item) {
        await prisma.order_Item.create({
            data: {
                orderId: orderDetails.id,
                quantity: cartItem.quantity,
                productId: cartItem.Product.id,
            },
        });
    }

    await emptyCart(userId);

    return orderDetails;
};

//
const mockPayment = async (totalAmount, provider) => {
    const paymentDetails = await prisma.payment_Details.create({
        data: {
            phpAmount: totalAmount,
            provider: provider,
            status: "complete",
            providerTransactionId: crypto.randomUUID(),
        },
    });
    return paymentDetails;
};

const createOrder = async (userId, paymentId, total) => {
    return await prisma.order_Details.create({
        data: {
            total: total,
            paymentId: paymentId,
            userId: userId,
        },
    });
};

const getOrderDetails = async (orderId) => {
    return await prisma.order_Details.findUnique({
        where: { id: orderId },
        include: {
            Order_Item: true,
        },
    });
};

const emptyCart = async (userId) => {
    const deletedCart = await prisma.shopping_Session.delete({
        where: { userId: userId },
    });
    await createCart(userId);
    return deletedCart;
};

module.exports = {
    createCart,
    addToCart,
    getCart,
    updateCartTotal,
    removeFromCart,
    checkout,
    getOrderDetails,
};
