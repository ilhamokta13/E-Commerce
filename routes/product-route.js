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

router.route('/create')
    .post(upload.single('image'), productController.createProduct)

router.route('/all')
    .get(productController.getAllProduct)

router.route('/detail/:id')
    .get(productController.getProductById)

router.route('/update/:id')
    .patch(productController.updateProduct)

router.route('/delete/:id')
    .delete(productController.deleteProduct)

module.exports = router;