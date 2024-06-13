const { response } = require('express');
const Product = require('../models/product-schema');
const cart = require('../models/cart-schema')
const Transaksi = require('../models/transaksi-schema');
const axios = require('axios');
const midtransClient = require('midtrans-client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const geolib = require('geolib');
const admin = require('../chat/firebase');

// Konfigurasi multer untuk penyimpanan file
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



class TransaksiController {

    // async createTransaksi(req, res) {
    //     const { id_barang, jumlah, total_harga } = req.body;
    //     const user = req.user.id;
    //     const products = await Product.find({
    //         _id: {
    //             $in: id_barang
    //         }
    //     })

    //     const newTransaksi = new Transaksi({
    //         kode_transaksi: 'TRX-' + Date.now() + Math.floor(Math.random() * 1000),
    //         user: user,
    //         Products: products.map((product, index) => ({
    //             ProductID: product._id,
    //             quantity: jumlah[index]
    //         })),
    //         total: total_harga
    //     });
    //     await newTransaksi.save();

    //     // Populate Products field in the newly created Transaksi
    //     const populatedTransaksi = await Transaksi.findById(newTransaksi._id).populate('Products.ProductID');

    //     await TransaksiController.createMidtransTransaction(res, populatedTransaksi);
    // }


    
    // async createTransaksi(req, res) {
    //     const user = req.user.id;
    //     const userCart = await cart.findOne({ userID: user }).populate('products.productID');

    //     if (!userCart || userCart.products.length === 0) {
    //         return res.status(400).json({
    //             message: 'Keranjang kosong atau tidak ditemukan'
    //         });
    //     }

       
    

    //     const newTransaksi = new Transaksi({
    //         kode_transaksi: 'TRX-' + Date.now() + Math.floor(Math.random() * 1000),
    //         user: user,
    //         Products: userCart.products.map(product => ({
    //             ProductID: product.productID._id,
    //             quantity: product.quantity
    //         })),
    //         total: userCart.products.reduce((sum, product) => sum + (product.productID.price * product.quantity), 0) + userCart.shippingCost,
    //         destination: {
    //             latitude: userCart.destination.latitude,
    //             longitude: userCart.destination.longitude
    //         },
    //         shippingCost: userCart.shippingCost
    //     });

    //     await newTransaksi.save();

    //     // Populate Products field in the newly created Transaksi
    //     const populatedTransaksi = await Transaksi.findById(newTransaksi._id).populate('Products.ProductID');

    //     await TransaksiController.createMidtransTransaction(res, populatedTransaksi);
    // }

    // async createTransaksi(req, res) {
    //     const user = req.user.id;
    //     const userCart = await cart.findOne({ userID: user }).populate('products.productID');
    
    //     if (!userCart || userCart.products.length === 0) {
    //         return res.status(400).json({
    //             message: 'Keranjang kosong atau tidak ditemukan'
    //         });
    //     }
    
    //     const newTransaksi = new Transaksi({
    //         kode_transaksi: 'TRX-' + Date.now() + Math.floor(Math.random() * 1000),
    //         user: user,
    //         Products: userCart.products.map(product => ({
    //             ProductID: product.productID._id,
    //             quantity: product.quantity
    //         })),
    //         total: userCart.products.reduce((sum, product) => sum + (product.productID.price * product.quantity), 0),
    //         destination: userCart.destination ? {
    //             latitude: userCart.destination.latitude,
    //             longitude: userCart.destination.longitude
    //         } : undefined,
    //         shippingCost: userCart.shippingCost || 0
    //     });
    
    //     await newTransaksi.save();
    
    //     // Populate Products field in the newly created Transaksi
    //     const populatedTransaksi = await Transaksi.findById(newTransaksi._id).populate('Products.ProductID');
    
    //     await TransaksiController.createMidtransTransaction(res, populatedTransaksi);
    // }

    async createTransaksi(req, res) {
        const user = req.user.id;
        const userCart = await cart.findOne({ userID: user }).populate('products.productID');
    
        if (!userCart || userCart.products.length === 0) {
            return res.status(400).json({
                message: 'Keranjang kosong atau tidak ditemukan'
            });
        }
    
        const newTransaksi = new Transaksi({
            kode_transaksi: 'TRX-' + Date.now() + Math.floor(Math.random() * 1000),
            user: user,
            Products: userCart.products.map(product => ({
                ProductID: product.productID._id,
                quantity: product.quantity
            })),
            total: userCart.products.reduce((sum, product) => sum + (product.productID.price * product.quantity), 0),
            destination: userCart.destination ? {
                latitude: userCart.destination.latitude,
                longitude: userCart.destination.longitude
            } : undefined,
            shippingCost: userCart.shippingCost || 0
        });
    
        await newTransaksi.save();
    
        // Populate Products field in the newly created Transaksi
        const populatedTransaksi = await Transaksi.findById(newTransaksi._id).populate('Products.ProductID');
    
        await TransaksiController.createMidtransTransaction(res, populatedTransaksi);
        
        // Kirim notifikasi ke admin setelah transaksi berhasil dibuat
        const message = {
            notification: {
                title: 'Pesanan Baru',
                body: 'Ada pesanan baru yang melibatkan produk Anda'
            },
            topic: 'admin'
        };

        admin.messaging().send(message)
            .then(response => {
                console.log('Successfully sent message:', response);
            })
            .catch(error => {
                console.error('Error sending message:', error);
            });
    }

    

    // static async createMidtransTransaction(res, transaksiData) {
    //     try {
    //         const midtransBaseUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    //         const midtransServerKey = 'SB-Mid-server-eDKCIhRGlkITnvMDtUpkinKE';

    //         let snap = new midtransClient.Snap({
    //             isProduction: false,
    //             serverKey: midtransServerKey
    //         });

    //         const items = transaksiData.Products.map(product => ({
    //             id: product.ProductID._id,
    //             price: product.ProductID.price,
    //             quantity: product.quantity,
    //             name: product.ProductID.nameProduct
    //         }));

    //         items.push({
    //             id: 'shipping_cost',
    //             price: transaksiData.shippingCost,
    //             quantity: 1,
    //             name: 'Shipping Cost'
    //         });

    //         const total = items.reduce((total, item) => total + (item.price * item.quantity), 0);

    //         const transactionDetails = {
    //             order_id: transaksiData.kode_transaksi.toString(),
    //             gross_amount: total
    //         };

    //         const requestBody = {
    //             transaction_details: transactionDetails,
    //             item_details: items,
    //         };

    //         snap.createTransaction(requestBody)
    //             .then((transaction) => {
    //                 res.status(201).json({
    //                     message: 'Transaksi berhasil dibuat',
    //                     data: transaksiData,
    //                     midtransResponse: transaction
    //                 });
    //             })
    //             .catch((error) => {
    //                 throw error;
    //             });
    //     } catch (error) {
    //         throw error;
    //     }
    // }


    static async createMidtransTransaction(res, transaksiData) {
        try {
            const midtransBaseUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
            const midtransServerKey = 'SB-Mid-server-eDKCIhRGlkITnvMDtUpkinKE';
    
            let snap = new midtransClient.Snap({
                isProduction: false,
                serverKey: midtransServerKey
            });
    
            const items = transaksiData.Products.map(product => ({
                id: product.ProductID._id,
                price: product.ProductID.price,
                quantity: product.quantity,
                name: product.ProductID.nameProduct
            }));
    
            // Hanya tambahkan detail biaya pengiriman jika ada
            if (transaksiData.shippingCost) {
                items.push({
                    id: 'shipping_cost',
                    price: transaksiData.shippingCost,
                    quantity: 1,
                    name: 'Shipping Cost'
                });
            }
    
            const total = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
            const transactionDetails = {
                order_id: transaksiData.kode_transaksi.toString(),
                gross_amount: total
            };
    
            const requestBody = {
                transaction_details: transactionDetails,
                item_details: items,
            };
    
            snap.createTransaction(requestBody)
                .then((transaction) => {
                    res.status(201).json({
                        message: 'Transaksi berhasil dibuat',
                        data: transaksiData,
                        midtransResponse: transaction
                    });
                })
                .catch((error) => {
                    throw error;
                });
        } catch (error) {
            throw error;
        }
    }
    


   
   

    // static async createMidtransTransaction(res, transaksiData) {
    //     try {
    //         const midtransBaseUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    //         const midtransServerKey = 'SB-Mid-server-eDKCIhRGlkITnvMDtUpkinKE';

    //         // Create Snap API instance
    //         let snap = new midtransClient.Snap({
    //             isProduction: false,
    //             serverKey: midtransServerKey
    //         });

    //         const headers = {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Basic ${Buffer.from(midtransServerKey + ':').toString('base64')}`
    //         };

    //         // console.log('transaksiData:', transaksiData.Products);

    //         const items = transaksiData.Products.map(product => ({
    //             id: product.ProductID._id,
    //             price: product.ProductID.price,
    //             quantity: product.quantity,
    //             name: product.ProductID.nameProduct
    //         }));

    //         const total = items.reduce((total, item) => total + (item.price * item.quantity), 0);

    //         const transactionDetails = {
    //             order_id: transaksiData.kode_transaksi.toString(),
    //             gross_amount: total
    //         };

    //         const requestBody = {
    //             transaction_details: transactionDetails,
    //             item_details: items,
    //         };

    //         snap.createTransaction(requestBody)
    //             .then((transaction) => {
    //                 res.status(201).json({
    //                     message: 'Transaksi berhasil dibuat',
    //                     data: transaksiData,
    //                     midtransResponse: transaction
    //                 });
    //             }
    //             ).catch((error) => {
    //                 throw error;
    //             });
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    
    

    async updateStatus(req, res) {
        const request = req.body;
        const order_id = request.order_id;

        const transaksi = await Transaksi.findOne({ kode_transaksi: order_id });

        if (transaksi && request.transaction_status === 'settlement') {
            if (request.transaction_status === 'settlement') {
                transaksi.status = 'Paid';
                transaksi.Products.forEach(product => {
                    product.status = 'Paid';
                });
            } else if (request.transaction_status === 'expire') {
                transaksi.status = 'Dibatalkan';
                transaksi.Products.forEach(product => {
                    product.status = 'Dibatalkan';
                });
            
            };

            await transaksi.save();
            res.status(200).json({
                message: 'Berhasil update status transaksi',
                data: transaksi
            });
        }
        else {
            res.status(400).json({
                message: 'Transaksi tidak ditemukan'
            });
        }
    }

    async getAllTransaksi(req, res) {
        const transaksi = await Transaksi.find({}).populate('Products.ProductID');
        res.status(200).json({
            message: 'Berhasil menampilkan data transaksi',
            data: transaksi
        });
    }

    async getTransaksi(req, res) {
        try {
            const user = req.user._id || '65b93b4f3b4839656e9c05b0';

            // Mengambil transaksi dari database dan memuat status transaksi
            const transaksi = await Transaksi.find({}).populate('Products.ProductID').select('+status');

            // Membuat array kosong untuk menampung produk yang dimiliki oleh pengguna
            const userProducts = [];

            // Memfilter produk yang dimiliki oleh pengguna
            transaksi.forEach(trx => {
                trx.Products.forEach(product => {
                    if (product.ProductID.sellerID.toString() === user) {
                        userProducts.push({
                            transaksiId: trx._id,
                            productId: product.ProductID._id,
                            productName: product.ProductID.nameProduct,
                            price: product.ProductID.price,
                            Image: product.ProductID.image,
                            quantity: product.quantity,
                            total: trx.total,
                            status: trx.status
                        });
                    }
                });
            });

            // Mengirimkan data transaksi beserta status
            res.status(200).json({
                message: 'Berhasil menampilkan data transaksi',
                data: userProducts
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Gagal memproses permintaan' });
        }
    }


  

    async getTransaksiUser(req, res) {
        const user = req.user.id;
        const transaksi = await Transaksi.find({ user: user }).populate('Products.ProductID');
        res.status(200).json({
            message: 'Berhasil menampilkan data transaksi Customer',
            data: transaksi
        });
    }

    async updateStatuss(req, res) {
        try {
            console.log('Request Body:', req.body);
            console.log('Request File:', req.file);
    
            const { productID, status, kode_transaksi } = req.body;
            const image = req.file ? req.file.filename : null;
    
            console.log(`Kode Transaksi: ${kode_transaksi}`);
            console.log(`Product ID: ${productID}`);
            console.log(`Image: ${image}`);
    
            const transaksi = await Transaksi.findOne({
                kode_transaksi: kode_transaksi,
                'Products.ProductID': productID
            });
    
            if (!transaksi) {
                return res.status(400).json({
                    message: 'Transaksi tidak ditemukan'
                });
            }
    
            let productUpdated = false;
            transaksi.Products.forEach(product => {
                if (product.ProductID.toString() === productID) {
                    product.status = status;
                    if (image) {
                        product.image = image;
                    }
                    productUpdated = true;
                }
            });
    
            if (!productUpdated) {
                return res.status(400).json({
                    message: 'Produk tidak ditemukan dalam transaksi'
                });
            }
    
            await transaksi.save();
    
            res.status(200).json({
                message: 'Berhasil update status transaksi',
                data: transaksi
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Gagal memproses permintaan' });
        }
    }
    
    

    async getTransaksiAdmin(req, res) {
        const adminUserID = req.user.id;
    
        try {
            const transaksi = await Transaksi.find({}).populate('Products.ProductID').populate('user');
    
            const adminTransaksi = transaksi.filter(trx => {
                let isSeller = false;
                trx.Products.forEach(product => {
                    if (product.ProductID && product.ProductID.sellerID && product.ProductID.sellerID.toString() === adminUserID) {
                        isSeller = true;
                    }
                });
                return isSeller;
            });
    
            const responseFilter = adminTransaksi.map(trx => {
                const products = trx.Products.filter(product => product.ProductID.sellerID.toString() === adminUserID);
                return {
                    transaksiId: trx._id,
                    kode_transaksi: trx.kode_transaksi,
                    user: trx.user,
                    products: products,
                    total: trx.total,
                    status: trx.status,
                    shippingCost: trx.shippingCost, // Tambahkan harga ongkir
                    destination: trx.destination // Tambahkan lokasi destinasi pengiriman
                };
            });

             // Kirim notifikasi FCM setelah transaksi diambil
            const message = {
                notification: {
                    title: 'Transaksi Baru',
                    body: 'Ada transaksi baru yang melibatkan produk Anda'
                },
                topic: 'admin'
            };
    
            admin.messaging().send(message)
                .then(response => {
                    console.log('Successfully sent message:', response);
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                });
            
            
    
            res.status(200).json({
                message: 'Berhasil menampilkan data transaksi admin',
                data: responseFilter
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Gagal menampilkan data transaksi admin' });
        }
    }

    // async getTransaksiAdmin(req, res) {
    //     const adminUserID = req.user.id;
    
    //     try {
    //         const transaksi = await Transaksi.find({}).populate('Products.ProductID').populate('user');
    
    //         const adminTransaksi = transaksi.filter(trx => {
    //             let isSeller = false;
    //             trx.Products.forEach(product => {
    //                 if (product.ProductID && product.ProductID.sellerID && product.ProductID.sellerID.equals(adminUserID)) {
    //                     isSeller = true;
    //                 }
    //             });
    //             return isSeller;
    //         }).map(trx => ({
    //             kode_transaksi: trx.kode_transaksi,
    //             user: trx.user.name,
    //             products: trx.Products.map(product => ({
    //                 name: product.ProductID.nameProduct,
    //                 quantity: product.quantity,
    //                 total: product.ProductID.price * product.quantity
    //             })),
    //             status: trx.status
    //         }));
    
    //         // Kirim notifikasi FCM setelah transaksi diambil
    //         const message = {
    //             notification: {
    //                 title: 'Transaksi Baru',
    //                 body: 'Ada transaksi baru yang melibatkan produk Anda'
    //             },
    //             topic: 'admin'
    //         };
    
    //         admin.messaging().send(message)
    //             .then(response => {
    //                 console.log('Successfully sent message:', response);
    //             })
    //             .catch(error => {
    //                 console.error('Error sending message:', error);
    //             });
    
    //         res.status(200).json({
    //             message: 'Berhasil menampilkan data transaksi Admin',
    //             data: adminTransaksi
    //         });
    //     } catch (error) {
    //         console.error('Error:', error);
    //         res.status(500).json({ error: 'Gagal memproses permintaan' });
    //     }
    // }
    
    

   


    async getGambar(req, res) {
        try {
            const { kode_transaksi, productID } = req.params;

            const transaksi = await Transaksi.findOne({
                $and: [
                    { kode_transaksi: kode_transaksi },
                    { 'Products.ProductID': productID }
                ]
            });

            if (!transaksi) {
                return res.status(400).json({
                    message: 'Transaksi tidak ditemukan'
                });
            }

            const product = transaksi.Products.find(product => product.ProductID.toString() === productID);

            if (!product || !product.image) {
                return res.status(400).json({
                    message: 'Gambar tidak ditemukan untuk produk ini'
                });
            }

            res.status(200).json({
                message: 'Berhasil mengambil gambar',
                imageUrl: product.imagePath
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Gagal memproses permintaan' });
        }
    }


   

    async getPendapatanMasingMasingToko(req, res) {
        try {
            const pendapatanDanTransaksiPerToko = await Transaksi.aggregate([
                {
                    $match: { 'status': { $in: ['Paid', 'Dikirim', 'Selesai'] } } // hanya transaksi dengan status Paid, Delivered, atau On Delivery
                },
                {
                    $unwind: '$Products'
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'Products.ProductID',
                        foreignField: '_id',
                        as: 'Product'
                    }
                },
                {
                    $unwind: '$Product'
                },
                {
                    $group: {
                        _id: '$Product.sellerID',
                        totalPendapatan: { $sum: { $multiply: ['$Product.price', '$Products.quantity'] } }, // menghitung total pendapatan per toko
                        transaksi: { $push: '$$ROOT' } // Menyertakan seluruh dokumen transaksi
                    }
                },
                {
                    $match: { totalPendapatan: { $gt: 0 } } // hanya transaksi dengan total pendapatan tidak kosong
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'Seller'
                    }
                },
                {
                    $unwind: '$Seller'
                },
                {
                    $project: {
                        _id: 0,
                        sellerID: '$Seller._id',
                        shopName: '$Seller.shopName',
                        totalPendapatan: 1,
                        transaksi: 1 // Menyertakan list transaksi
                    }
                }
            ]);
    
    
            // Mengirimkan hasil grouping sebagai respons
            res.status(200).json({
                message: 'Berhasil menghitung pendapatan masing-masing toko',
                data: pendapatanDanTransaksiPerToko
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Gagal memproses permintaan' });
        }
    }






}






module.exports = new TransaksiController();