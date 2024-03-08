const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksi-controller');
const { checkAuth } = require('../utils/middleware');

router.route('/create')
    .post(checkAuth, transaksiController.createTransaksi)

router.route('/get')
    .get(transaksiController.getAllTransaksi)

router.route('/update')
    .post(transaksiController.updateStatus);

// router.route('/get/admin')
//     .get(transaksiController.getTransaksiAdmin)

module.exports = router;