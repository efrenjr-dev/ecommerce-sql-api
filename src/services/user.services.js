const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { prisma, xprisma } = require("../utils/prisma");
const logger = require("../config/logger");

/**
 *
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
    if (await xprisma.user.isEmailTaken(userBody.email)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists");
    }
    return await xprisma.user.create({
        data: {
            name: userBody.name,
            email: userBody.email,
            password: userBody.password,
        },
        omit: {
            password: true,
        },
    });
};

/**
 *
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id: id },
        omit: { password: true },
    });
};

/**
 *
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
    return await prisma.user.findUnique({ where: { email: email } });
};

/**
 *
 * @param {*} searchString
 * @param {*} skip
 * @param {*} take
 * @returns {Promise<object>}
 */
const getUsers = async (searchString, skip, take, userId) => {
    const users = await prisma.user.findMany({
        skip: parseInt(skip),
        take: parseInt(take),
        where: {
            OR: [
                { email: { contains: searchString, mode: "insensitive" } },
                { name: { contains: searchString, mode: "insensitive" } },
            ],
            NOT: {
                id: userId,
            },
        },
        orderBy: [{ role: "asc" }, { email: "asc" }],
        omit: {
            password: true,
        },
    });

    const usersCount = await prisma.user.count({
        where: {
            OR: [
                { email: { contains: searchString, mode: "insensitive" } },
                { name: { contains: searchString, mode: "insensitive" } },
            ],
            NOT: {
                id: userId,
            },
        },
    });

    return { users, usersCount };
};

/**
 *
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUser = async (userId, updateBody) => {
    if (
        updateBody.email &&
        (await xprisma.user.isEmailTaken(updateBody.email, userId))
    ) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }

    const updatedUser = await xprisma.user.update({
        where: { id: userId },
        data: updateBody,
        omit: {
            password: true,
        },
    });

    return updatedUser;
};

module.exports = {
    createUser,
    getUserById,
    getUserByEmail,
    getUsers,
    updateUser,
};
