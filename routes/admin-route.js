const express = require('express');
const router = express.Router();
const { checkAuth } = require('../utils/middleware');
const productController = require('../controllers/product-controller');
const userController = require('../controllers/user-controller');

router.route('/product')
    .get(checkAuth, productController.getAdminProduct)

// Complete Profile
router.route('/complete-profile')
    .put(checkAuth, userController.completeProfile);

module.exports = router;