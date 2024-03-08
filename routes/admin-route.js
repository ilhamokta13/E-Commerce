const express = require('express');
const router = express.Router();
const { checkAuth, checkAuthor } = require('../utils/middleware');
const productController = require('../controllers/product-controller');
const userController = require('../controllers/user-controller');
const transaksiController = require('../controllers/transaksi-controller');

router.route('/product')
    .get(checkAuth, productController.getAdminProduct)

router.route('/transaksi')
    // .get(checkAuth, transaksiController.getTransaksi)
    .get(checkAuth, transaksiController.getTransaksi)

// Complete Profile
router.route('/complete-profile')
    .patch(checkAuth, checkAuthor, userController.completeProfile);




module.exports = router;