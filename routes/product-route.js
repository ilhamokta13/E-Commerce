const express = require('express');
const router = express.Router();
const productController = require('../controllers/product-controller');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });
const { checkAuth, checkAuthor, checkOwnerProduct } = require('../utils/middleware');


router.route('/')
    .get(productController.getAllProduct)
    .post(checkAuth, checkAuthor, upload.single('image'), productController.createProduct)

router.route('/:id')
    .get(productController.getProductById)
    .patch(checkAuth, checkAuthor, checkOwnerProduct, upload.single('image'), productController.updateProduct)
    .delete(checkAuth, checkAuthor, checkOwnerProduct, productController.deleteProduct)

router.route('/shop/:shopName')
    .get(productController.getProductsByshopName);

module.exports = router;