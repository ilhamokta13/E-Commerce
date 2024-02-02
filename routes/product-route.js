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
const jwt = require('jsonwebtoken');

const checkAuth = (req, res, next) => {
    console.log(req.headers.authorization);
    if (req.headers.authorization.split(' ')[0] === 'Bearer') {

        const payload = jwt.verify(req.headers.authorization.split(' ')[1], process.env.SECRET_KEY);
        req.user = payload;
        next();
    } else {
        res.status(401).json({
            message: 'Unauthorized'
        });
    }
}

router.route('/create')
    .post(checkAuth, upload.single('image'), productController.createProduct)

router.route('/all')
    .get(productController.getAllProduct)

router.route('/detail/:id')
    .get(productController.getProductById)

router.route('/update/:id')
    .patch(checkAuth, upload.single('image'), productController.updateProduct)

router.route('/delete/:id')
    .delete(productController.deleteProduct)

module.exports = router;