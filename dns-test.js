const dns = require("dns");

dns.resolveSrv("_mongodb._tcp.cluster0.qcc9fd6.mongodb.net", (err, addresses) => {
    if (err) {
        console.error("SRV Error:", err);
    } else {
        console.log("SRV Records:");
        console.log(addresses);
    }
});