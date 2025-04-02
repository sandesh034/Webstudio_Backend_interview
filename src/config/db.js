const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;


const connectDB = async () => {
    // console.log(MONGO_URI);
    try {
        const connectionResponse = await mongoose.connect(process.env.MONGO_URI, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log(`MongoDB connected: ${connectionResponse.connection.host}`);

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }

}

module.exports = connectDB;
