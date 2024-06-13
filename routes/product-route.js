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


// router.route ('/:id/price')
// .patch(checkAuth, productController.updateProductPrice)

router.route('/:id/price')
    .patch(checkAuth, productController.updateProductPrice)



router.route('/')
    .get(productController.getAllProduct)
    .post(checkAuth, checkAuthor, upload.single('image'), productController.createProduct)

router.route('/:id')
    .get(productController.getProductById)
    .patch(checkAuth, checkAuthor, checkOwnerProduct, upload.single('image'), productController.updateProduct)
    .delete(checkAuth, checkAuthor, checkOwnerProduct, productController.deleteProduct)

router.route('/shop/:shopName')
    .get(productController.getProductsByshopName);


// Endpoint untuk mengajukan tawaran harga
router.route('/:id/offer')
    .post(checkAuth, productController.makeOffer);

// Endpoint untuk mengonfirmasi tawaran harga
router.route('/:id/offer/:offerId')
    .patch(checkAuth, checkOwnerProduct, productController.confirmOffer);

   // Router modification
router.route('/:id/offers/status')
.get(checkAuth, checkOwnerProduct, productController.getOfferStatuses);


// Endpoint untuk pembeli melihat status tawaran harga yang mereka buat
router.route('/offers/status')
    .get(checkAuth, productController.getBuyerOfferStatus);









    // router.route('/:id/shipping-cost')
    // .post(checkAuth, productController.calculateShippingCost);

   

module.exports = router;