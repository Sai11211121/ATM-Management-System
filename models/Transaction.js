const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({

    account_no:Number,
    transaction_type:String,
    amount:Number,
    balance_after:Number,

    transaction_date:{
        type:Date,
        default:Date.now
    }

});

module.exports=mongoose.model("Transaction",transactionSchema);