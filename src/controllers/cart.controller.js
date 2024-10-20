const httpStatus = require("http-status");
const logger = require("../config/logger");
const catchAsync = require("../utils/catchAsync");

const createCart = catchAsync(async (req, res) => {
    logger.debug("CREATE CART CONTROLLER");
    res.status(httpStatus.OK).send("Create Cart");
});

module.exports = { createCart };
