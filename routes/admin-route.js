const express = require('express');
const router = express.Router();
const productController = require('../controllers/product-controller');
const { checkAuth } = require('../utils/middleware');

router.route('/product')
    .get(checkAuth, productController.getAdminProduct)

module.exports = router;