const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    account_no:{
        type:Number,
        unique:true
    },
    name:String,
    pin:String,
    balance:Number
});

module.exports = mongoose.model("Customer",customerSchema);