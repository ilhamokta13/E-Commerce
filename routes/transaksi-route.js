const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksi-controller');
const { checkAuth } = require('../utils/middleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

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

// router.route('/updateStatus')
//     .patch(checkAuth, transaksiController.updateStatuss);

router.route('/updateStatus')
    .patch(checkAuth, upload.single('image'), transaksiController.updateStatuss);

router.route('/getPendapatan')
    .get(transaksiController.getPendapatanMasingMasingToko)


router.route('/getGambar/:kode_transaksi/:productID')
.get(transaksiController.getGambar);









// router.route('/get/admin')
//     .get(transaksiController.getTransaksiAdmin)

module.exports = router;