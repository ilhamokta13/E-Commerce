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

router.route('/getUserTransaksi')
    .get(checkAuth, transaksiController.getTransaksiUser)

router.route('/getAdminTransaksi')
    .get(checkAuth, transaksiController.getTransaksiAdmin)

router.route('/updateStatus')
    .patch(checkAuth, transaksiController.updateStatuss);

router.route('/getPendapatan')
    .get(transaksiController.getPendapatanMasingMasingToko)


// router.route('/get/admin')
//     .get(transaksiController.getTransaksiAdmin)

module.exports = router;