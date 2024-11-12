const httpStatus = require("http-status");
const logger = require("../config/logger");
const {
    authService,
    tokenService,
    userService,
    emailService,
    cartService,
} = require("../services");
const catchAsync = require("../utils/catchAsync");

const register = catchAsync(async (req, res) => {
    logger.debug("REGISTER USER");
    const user = await userService.createUser(req.body);
    await cartService.createCart(user.id);
    const emailToken = await tokenService.generateEmailVerificationToken(user);
    await emailService.sendVerificationEmail(user.email, user.name, emailToken);
    res.status(httpStatus.CREATED).send({
        message: "User has been registered.",
        user,
    });
});

const login = catchAsync(async (req, res) => {
    logger.debug("LOGIN USER");
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(httpStatus.OK)
        // .cookie("accessToken", tokens.access.token, {
        //     expires: tokens.access.expires,
        //     secure: true,
        //     sameSite: "None",
        // })
        // .cookie("refreshToken", tokens.refresh.token, {
        //     expires: tokens.refresh.expires,
        //     secure: true,
        //     sameSite: "None",
        // })
        .send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
    logger.debug("LOGOUT USER");
    await tokenService.blacklistToken(req.query.token);
    res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
    logger.debug("REFRESH AUTH TOKENS");
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAuth(refreshToken);
    res.status(httpStatus.OK)
        // .cookie("accessToken", tokens.access.token, {
        //     expires: tokens.access.expires,
        //     secure: true,
        //     sameSite: "None",
        // })
        // .cookie("refreshToken", tokens.refresh.token, {
        //     expires: tokens.refresh.expires,
        //     secure: true,
        //     sameSite: "None",
        // })
        .send({ message: "Refreshed tokens", tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
    logger.debug("FORGOT PASSWORD");
    const user = await userService.getUserByEmail(req.body.email);
    if (user) {
        const resetPasswordToken =
            await tokenService.generateResetPasswordToken(req.body.email);
        await emailService.sendResetPasswordEmail(
            req.body.email,
            resetPasswordToken
        );
    }

    res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
    logger.debug("SEND VERIFICATION EMAIL");
    const emailVerificationToken =
        await tokenService.generateEmailVerificationToken(req.user);
    await emailService.sendVerificationEmail(
        req.user.email,
        req.user.name,
        emailVerificationToken
    );
    res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
    logger.debug("VERIFY EMAIL");
    await authService.verifyEmail(req.query.token);
    res.status(httpStatus.ACCEPTED).send({
        message: "Email has been verified.",
    });
});

const resetPassword = catchAsync(async (req, res) => {
    logger.debug("RESET PASSWORD");
    await authService.resetPassword(req.query.token, req.body.password);
    res.status(httpStatus.ACCEPTED).send({
        message: "Password has been reset.",
    });
});

module.exports = {
    register,
    login,
    logout,
    refreshTokens,
    sendVerificationEmail,
    verifyEmail,
    resetPassword,
    forgotPassword,
};
