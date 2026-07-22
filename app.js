const express = require("express");
const oracledb = require("oracledb");
const path = require("path");

oracledb.initOracleClient({
    libDir: "C:\\Users\\kasam\\OneDrive\\Desktop\\sem 3\\sem 3\\oracle\\instantclient_23_0"
});

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const dbConfig = {
    user: "SYSTEM",
    password: "SNSu1121",
    connectString: "localhost:1521/XE"
};

// Store logged in account
let currentAccount = null;

// ================= LOGIN =================

app.post("/login", async (req, res) => {

    const { account_no, pin } = req.body;

    let connection;

    try {

        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT account_no,name
             FROM customers
             WHERE account_no=:1
             AND pin=:2`,
            [account_no, pin]
        );

        if (result.rows.length > 0) {

            currentAccount = account_no;

            res.sendFile(path.join(__dirname, "public", "dashboard.html"));

        } else {

            res.send("<h2>Invalid Account Number or PIN</h2>");

        }

    } catch (err) {

        console.log(err);
        res.send("Database Error");

    } finally {

        if (connection)
            await connection.close();

    }

});

// ================= BALANCE =================

app.get("/balance", async (req, res) => {

    let connection;

    try {

        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT balance
             FROM customers
             WHERE account_no=:1`,
            [currentAccount]
        );

        if (result.rows.length == 0) {

            res.send("Account Not Found");
            return;

        }

        const balance = result.rows[0][0];

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

<h1>₹ ${balance}</h1>

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

    } finally {

        if (connection)
            await connection.close();

    }

});

// ================= DEPOSIT =================

app.post("/deposit", async (req, res) => {

    let connection;

    try {

        const amount = Number(req.body.amount);

        if (amount <= 0) {
            return res.send("<h2>Enter a valid amount.</h2>");
        }

        connection = await oracledb.getConnection(dbConfig);

        // Get current balance
        const result = await connection.execute(
            `SELECT balance
             FROM customers
             WHERE account_no = :1`,
            [currentAccount]
        );

        if (result.rows.length === 0) {
            return res.send("<h2>Account Not Found</h2>");
        }

        let balance = result.rows[0][0];

        balance = balance + amount;

        // Update balance
        await connection.execute(
            `UPDATE customers
             SET balance = :1
             WHERE account_no = :2`,
            [balance, currentAccount]
        );

        // Insert transaction
        await connection.execute(
            `INSERT INTO transactions
            VALUES(
                transaction_seq.NEXTVAL,
                :1,
                'DEPOSIT',
                :2,
                :3,
                SYSDATE
            )`,
            [currentAccount, amount, balance]
        );

        await connection.commit();

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

<h3>Current Balance: ₹${balance}</h3>

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

    } finally {

        if (connection)
            await connection.close();

    }

});
// ================= WITHDRAW =================

app.post("/withdraw", async (req, res) => {

    let connection;

    try {

        const amount = Number(req.body.amount);

        if (amount <= 0) {
            return res.send("<h2>Enter a valid amount.</h2>");
        }

        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT balance
             FROM customers
             WHERE account_no = :1`,
            [currentAccount]
        );

        if (result.rows.length === 0) {
            return res.send("<h2>Account Not Found</h2>");
        }

        let balance = result.rows[0][0];

        if (balance < amount) {
            return res.send("<h2>Insufficient Balance</h2><br><a href='/dashboard.html'><button>Back</button></a>");
        }

        balance = balance - amount;

        await connection.execute(
            `UPDATE customers
             SET balance = :1
             WHERE account_no = :2`,
            [balance, currentAccount]
        );

        await connection.execute(
            `INSERT INTO transactions
            VALUES(
                transaction_seq.NEXTVAL,
                :1,
                'WITHDRAW',
                :2,
                :3,
                SYSDATE
            )`,
            [currentAccount, amount, balance]
        );

        await connection.commit();

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

<h3>Current Balance ₹${balance}</h3>

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

    } finally {

        if (connection)
            await connection.close();

    }

});
// ================= MINI STATEMENT =================

app.get("/statement", async (req, res) => {

    let connection;

    try {

        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT transaction_type,
                    amount,
                    balance_after,
                    TO_CHAR(transaction_date,'DD-MON-YYYY HH24:MI')
             FROM transactions
             WHERE account_no = :1
             ORDER BY transaction_id DESC`,
            [currentAccount]
        );

        let rows = "";

        for (let row of result.rows) {

            rows += `
            <tr>
                <td>${row[0]}</td>
                <td>₹${row[1]}</td>
                <td>₹${row[2]}</td>
                <td>${row[3]}</td>
            </tr>`;
        }

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

    } finally {

        if (connection)
            await connection.close();

    }

});
// ================= LOGOUT =================

app.get("/logout", (req, res) => {

    currentAccount = null;

    res.redirect("/");

});

// ================= SERVER =================

app.listen(3000, () => {

    console.log("Server running at http://localhost:3000");

});