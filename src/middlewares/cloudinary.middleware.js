const cloudinary = require("cloudinary").v2
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})
// console.log(cloudinary.config());
const uploadFileToCloudinary = async (imagePath) => {
    const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        resource_type: "auto"
    };

    try {
        if (!imagePath) return null;
        const result = await cloudinary.uploader.upload(imagePath, options);

        return result.secure_url;
    } catch (error) {
        console.error("Error while file upload", error);
        return null;
    }

}

module.exports = uploadFileToCloudinary

