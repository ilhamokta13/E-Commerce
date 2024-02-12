const express = require('express');
const router = express.Router();
const { checkAuth, checkAuthor } = require('../utils/middleware');
const productController = require('../controllers/product-controller');
const userController = require('../controllers/user-controller');

router.route('/product')
    .get(checkAuth, productController.getAdminProduct)

// Complete Profile
router.route('/complete-profile')
    .patch(checkAuth, checkAuthor, userController.completeProfile);




module.exports = router;