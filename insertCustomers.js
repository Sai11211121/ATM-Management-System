const mongoose = require("mongoose");
require("dotenv").config();

const Customer = require("./models/Customer");

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {

    console.log("Connected to MongoDB");

    await Customer.deleteMany({});

    const customers = [
        {
            account_no: 1001,
            name: "Venkat",
            pin: "1234",
            balance: 50000
        },
        {
            account_no: 1002,
            name: "Ram",
            pin: "1111",
            balance: 25000
        }
        // Remaining customers go here...
    ];

    await Customer.insertMany(customers);

    console.log("Customers inserted successfully");

    process.exit();

})
.catch(err => {
    console.log(err);
});