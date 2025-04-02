const User = require('../models/user.model');
const uploadFileToCloudinary = require('../middlewares/cloudinary.middleware');
const apiResponse = require('../utils/apiResponse');
const apiError = require('../utils/apiError');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

const registerUser = async (req, res) => {

    //res.send("request received for register user");
    try {
        const { name, email, password, role } = req.body;


        if ([name, email, password, role].some((field) => {
            return !field || field.trim() === ""
        })) {
            throw new apiError(400, "All the fields are required")
        }

        const isUserAlreadyExists = await User.findOne({ email });
        if (isUserAlreadyExists) {
            throw new apiError(400, "User already exists")
        }
        const image = req.file.path;
        if (!image) {
            throw new apiError(400, "Image is required")
        }
        const imageUrl = await uploadFileToCloudinary(image);
        if (!imageUrl) {
            throw new apiError(400, "Image upload failed")
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            image: imageUrl

        })

        const createdUser = await User.findById(user._id).select('-password')
        if (!createdUser) {
            throw new apiError(400, "Failled to register user")
        }

        res.status(201).json(new apiResponse(201, "User registered successfully", user));

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}


const loginUser = async (req, res) => {
    //console.log("request received for login user");
    //res.send("request received for login user");
    try {
        const { email, password } = req.body;

        if ([email, password].some((field) => {
            return !field || field.trim() === ""
        })) {
            throw new apiError(400, "All the fields are required")
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new apiError(400, "Invalid credentials")
        }

        //console.log(user, typeof (user))

        const isPasswordMatched = await user.isPasswordMatched(password);
        if (!isPasswordMatched) {
            throw new apiError(400, "Invalid credentials")
        }
        const _id = user._id.toString();
        const accessToken = generateAccessToken({ id: _id, email, role: user.role });
        const refreshToken = generateRefreshToken({ id: _id });

        const updatedUser = await User.findByIdAndUpdate(user._id, {
            refreshToken: refreshToken
        });
        if (!updatedUser) {
            throw new apiError(400, "Failed to update refresh token")
        }

        res.status(200)
            .cookie('accessToken', accessToken, { httpOnly: true, secure: true })
            .cookie('refreshToken', refreshToken, { httpOnly: true, secure: true })
            .json(new apiResponse(200, "User logged in successfully", {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
            }));

    } catch (error) {
        //console.log(error);
        res.status(500).json({
            message: error.message,
            success: false,
        });
    }

}

const logoutuser = async (req, res) => {

    try {


        const { id } = req.user;
        const user = await User.findById(id);
        if (!user) {
            throw new apiError(404, 'User not found');
        }

        const removeRefreshToken = await User.findByIdAndUpdate(id, {
            refreshToken: ''
        }, { new: true });

        if (!removeRefreshToken) {
            throw new apiError(500, 'Error in removing refresh token');
        }

        res.status(200)
            .clearCookie('accessToken', { httpOnly: true, secure: true })
            .clearCookie('refreshToken', { httpOnly: true, secure: true })
            .json(new apiResponse(200, "User logged out successfully", {}));

    } catch (error) {
        console.error('Error in logOutUser function:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Internal Server Error',
            success: false,
        });
    }

}


module.exports = {
    registerUser,
    loginUser,
    logoutuser
}