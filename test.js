const mongoose = require("mongoose");
require("dotenv").config();

(async () => {
    try {
        console.log("URI:", process.env.MONGODB_URI);

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ Connected to MongoDB");
        process.exit(0);
    } catch (err) {
        console.error("❌ Connection Error:");
        console.error(err);
        process.exit(1);
    }
})();