const httpStatus = require("http-status");
const logger = require("../config/logger");
const catchAsync = require("../utils/catchAsync");

const createProduct = catchAsync(async (req, res) => {
    logger.debug("CREATE PRODUCT CONTROLLER");

    res.status(httpStatus.OK).send("Create product controller");
});

module.exports = { createProduct };
