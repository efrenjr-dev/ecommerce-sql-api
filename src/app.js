const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("./config/morgan");
const { authLimiter } = require("./middlewares/rateLimiter");
const { slowLimit } = require("./middlewares/slowDown");
const passport = require("passport");
const { passportJwtStrategy } = require("./config/passport");
const cookieParser = require("cookie-parser");
const { xss } = require("express-xss-sanitizer");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");

const config = require("./config/config");
const httpStatus = require("http-status");
const ApiError = require("./utils/ApiError");
const { errorConverter, errorHandler } = require("./middlewares/error");
const routes = require("./routes/v1/");
const {
    deserializeSuperJson,
    serializeSuperJson,
} = require("./middlewares/superjson");
const { auth } = require("./middlewares/auth");

const app = express();

if (config.env !== "test") {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
}

// Security middleware
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(compression());

// CORS middleware
app.use(
    cors({
        origin: (origin, callback) => {
            // Check if the origin is in the allowedOrigins list or if the origin is null (e.g., for non-browser requests)
            if (config.appUrl.includes(origin) || !origin) {
                callback(null, true); // Allow the origin
            } else {
                callback(new Error("Not allowed by CORS"), false); // Reject the origin
            }
        },
        credentials: true,
    })
);
// app.options("*", cors());

// Rate limiting middleware
if (config.env === "production") {
    app.use(authLimiter);
    app.use(slowLimit);
}

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(deserializeSuperJson);
app.use(serializeSuperJson);

// Passport middleware
passport.use(passportJwtStrategy);

if (config.env === "production") {
    app.use("/v1/auth", authLimiter);
    // app.use("/v1", slowLimit);
}

app.use("/v1", routes);

app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, "Not Found"));
});

app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
