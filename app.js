const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");
const Customer = require("./models/Customer");
const Transaction = require("./models/Transaction");


const app = express();
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.log(err);
});
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));



// Store logged in account
let currentAccount = null;

// ================= LOGIN =================

app.post("/login", async (req, res) => {

    const { account_no, pin } = req.body;

    try {

        const customer = await Customer.findOne({
            account_no: Number(account_no),
            pin: pin
        });

        if (!customer) {
            return res.send("<h2>Invalid Account Number or PIN</h2>");
        }

        currentAccount = customer.account_no;

        res.sendFile(path.join(__dirname, "public", "dashboard.html"));

    }
    catch (err) {

        console.log(err);
        res.send("Database Error");

    }

});

// ================= BALANCE =================

// ================= BALANCE =================

app.get("/balance", async (req, res) => {

    try {

        const customer = await Customer.findOne({
            account_no: currentAccount
        });

        if (!customer) {
            return res.send("<h2>Account Not Found</h2>");
        }

        res.send(`
<!DOCTYPE html>

<html>

<head>

<title>Balance</title>

<link rel="stylesheet" href="/style.css">

</head>

<body>

<div class="login-box">

<h1>ABC BANK ATM</h1>

<h2>Your Balance</h2>

<h1>₹ ${customer.balance}</h1>

<br>

<a href="/dashboard.html">
<button>Back</button>
</a>

</div>

</body>

</html>
`);

    } catch (err) {

        console.log(err);
        res.send("Database Error");

    }

});

// ================= DEPOSIT =================

// ================= DEPOSIT =================

app.post("/deposit", async (req, res) => {

    try {

        const amount = Number(req.body.amount);

        if (amount <= 0) {
            return res.send("<h2>Enter a valid amount.</h2>");
        }

        const customer = await Customer.findOne({
            account_no: currentAccount
        });

        if (!customer) {
            return res.send("<h2>Account Not Found</h2>");
        }

        customer.balance += amount;
        await customer.save();

        await Transaction.create({
            account_no: currentAccount,
            transaction_type: "DEPOSIT",
            amount: amount,
            balance_after: customer.balance
        });

        res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Deposit Successful</title>
<link rel="stylesheet" href="/style.css">
</head>

<body>

<div class="login-box">

<h1>ABC BANK ATM</h1>

<h2>Deposit Successful</h2>

<h3>Amount Deposited: ₹${amount}</h3>

<h3>Current Balance: ₹${customer.balance}</h3>

<br>

<a href="/dashboard.html">
<button>Back to Dashboard</button>
</a>

</div>

</body>
</html>
`);

    } catch (err) {

        console.log(err);
        res.send("Database Error");

    }

});
// ================= WITHDRAW =================



app.post("/withdraw", async (req, res) => {

    try {

        const amount = Number(req.body.amount);

        if (amount <= 0) {
            return res.send("<h2>Enter a valid amount.</h2>");
        }

        const customer = await Customer.findOne({
            account_no: currentAccount
        });

        if (!customer) {
            return res.send("<h2>Account Not Found</h2>");
        }

        if (customer.balance < amount) {
            return res.send("<h2>Insufficient Balance</h2><br><a href='/dashboard.html'><button>Back</button></a>");
        }

        customer.balance -= amount;

        await customer.save();

        await Transaction.create({
            account_no: currentAccount,
            transaction_type: "WITHDRAW",
            amount: amount,
            balance_after: customer.balance
        });

        res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Withdraw Successful</title>
<link rel="stylesheet" href="/style.css">
</head>

<body>

<div class="login-box">

<h1>ABC BANK ATM</h1>

<h2>Withdrawal Successful</h2>

<h3>Withdrawn ₹${amount}</h3>

<h3>Current Balance ₹${customer.balance}</h3>

<br>

<a href="/dashboard.html">
<button>Back to Dashboard</button>
</a>

</div>

</body>
</html>
`);

    } catch (err) {

        console.log(err);
        res.send("Database Error");

    }

});
// ================= MINI STATEMENT =================

// ================= MINI STATEMENT =================

app.get("/statement", async (req, res) => {

    try {

        const transactions = await Transaction.find({
            account_no: currentAccount
        }).sort({ transaction_date: -1 });

        let rows = "";

        transactions.forEach((t) => {

            rows += `
            <tr>
                <td>${t.transaction_type}</td>
                <td>₹${t.amount}</td>
                <td>₹${t.balance_after}</td>
                <td>${new Date(t.transaction_date).toLocaleString()}</td>
            </tr>`;
        });

        res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Mini Statement</title>
<link rel="stylesheet" href="/style.css">
<style>
table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}
th,td{
border:1px solid black;
padding:10px;
text-align:center;
}
</style>
</head>

<body>

<div class="login-box" style="width:800px;">

<h1>Mini Statement</h1>

<table>

<tr>
<th>Type</th>
<th>Amount</th>
<th>Balance</th>
<th>Date</th>
</tr>

${rows}

</table>

<br>

<a href="/dashboard.html">
<button>Back</button>
</a>

</div>

</body>

</html>
`);

    } catch (err) {

        console.log(err);
        res.send("Database Error");

    }

});
// ================= LOGOUT =================

app.get("/logout", (req, res) => {

    currentAccount = null;

    res.redirect("/");

});

// ================= SERVER =================


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});

