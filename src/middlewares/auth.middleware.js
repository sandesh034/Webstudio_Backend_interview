const User = require('../models/user.model');
const apiResponse = require('../utils/apiResponse');
const apiError = require('../utils/apiError');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');



const checkLogin = async (req, res, next) => {
    const { accessToken, refreshToken } = req.cookies;

    if (!accessToken && !refreshToken) {
        return res.status(401).json(new apiResponse(401, "Unauthorized Request. No token found", null));
    }

    try {
        let decodedToken;
        try {
            decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET_KEY)
        } catch (accessErr) {
            if (!refreshToken) {
                return res.status(401).json(new apiResponse(401, "Unauthorized Request. Token expired", null));
            }

            try {
                const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
                const { id } = refreshDecoded;
                const user = await User.findById(id);

                if (!user) {
                    return res.status(401).json(new apiResponse(401, "Invalid refresh token", null));
                }

                const newAccessToken = generateAccessToken(user);
                const newRefreshToken = generateRefreshToken({ id: user._id });

                await User.findByIdAndUpdate(id, { refreshToken: newRefreshToken });

                res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: true });
                res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: true });

                req.user = refreshDecoded;
                return next();

            } catch (refreshErr) {
                return res.status(401).json(new apiResponse(401, "Unauthorized Request. Token expired", null));
            }
        }

        req.user = decodedToken;
        next();

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}

const checkSuperAdmin = (req, res, next) => {
    try {
        if (req.user.role !== 'superAdmin') {
            return res.status(403).json(new apiResponse(403, "Only Superadmin can create user and admin", null));
        }
        next();

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}

module.exports = {
    checkLogin,
    checkSuperAdmin
}

