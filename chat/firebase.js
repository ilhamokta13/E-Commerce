const admin = require("firebase-admin");
const serviceAccount = require("../chat/serviceAccountKey.json");
const transaksiController = require("../controllers/transaksi-controller");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://etu-market---buyer-default-rtdb.firebaseio.com"
});

module.exports = admin;
