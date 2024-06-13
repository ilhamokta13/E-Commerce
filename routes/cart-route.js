const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart-controller');
const { checkAuth, checkAuthor, checkOwnerProduct } = require('../utils/middleware');

router.route('/')
    .get(checkAuth, cartController.getCart)
    .post(checkAuth, cartController.addToCart)
    .patch(checkAuth, cartController.updateCart)
    .delete(checkAuth, cartController.deleteCart);


module.exports = router;

