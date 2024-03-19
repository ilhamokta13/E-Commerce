const { response } = require('express');
const Product = require('../models/product-schema');
const Transaksi = require('../models/transaksi-schema');
const axios = require('axios');
const midtransClient = require('midtrans-client');

class TransaksiController {
    // async createTransaksi(req, res) {
    //     const { id_barang, jumlah, total_harga } = req.body;
    //     const user = req.user.id;
    //     const products = await Product.find({
    //         _id: {
    //             $in: id_barang
    //         }
    //     });
    //     console.log(products.map((product, index) => ({
    //         productID: product._id,
    //         quantity: jumlah[index]
    //     })));
    //     const newTransaksi = new Transaksi({
    //         user: user,
    //         Products: products.map((product, index) => ({
    //             ProductID: product._id,
    //             quantity: jumlah[index]
    //         })),
    //         total: total_harga
    //     });
    //     await newTransaksi.save();
    //     res.status(201).json({
    //         message: 'Transaksi berhasil dibuat',
    //         data: newTransaksi
    //     });
    // }

    async createTransaksi(req, res) {
        const { id_barang, jumlah, total_harga } = req.body;
        const user = req.user.id;
        const products = await Product.find({
            _id: {
                $in: id_barang
            }
        })

        const newTransaksi = new Transaksi({
            kode_transaksi: 'TRX-' + Date.now() + Math.floor(Math.random() * 1000),
            user: user,
            Products: products.map((product, index) => ({
                ProductID: product._id,
                quantity: jumlah[index]
            })),
            total: total_harga
        });
        await newTransaksi.save();

        // Populate Products field in the newly created Transaksi
        const populatedTransaksi = await Transaksi.findById(newTransaksi._id).populate('Products.ProductID');

        await TransaksiController.createMidtransTransaction(res, populatedTransaksi);
    }

    static async createMidtransTransaction(res, transaksiData) {
        try {
            const midtransBaseUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
            const midtransServerKey = 'SB-Mid-server-epMxg_ncWANTgBMQ_es5eIHn';

            // Create Snap API instance
            let snap = new midtransClient.Snap({
                isProduction: false,
                serverKey: midtransServerKey
            });

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(midtransServerKey + ':').toString('base64')}`
            };

            // console.log('transaksiData:', transaksiData.Products);

            const items = transaksiData.Products.map(product => ({
                id: product.ProductID._id,
                price: product.ProductID.price,
                quantity: product.quantity,
                name: product.ProductID.nameProduct
            }));

            console.log('items:', items);
            console.log('transaksiData:', transaksiData._id.toString());

            const total = items.reduce((total, item) => total + (item.price * item.quantity), 0);

            const transactionDetails = {
                order_id: transaksiData.kode_transaksi.toString(),
                gross_amount: total
            };
            console.log('transactionDetails:', transactionDetails);

            const requestBody = {
                transaction_details: transactionDetails,
                item_details: items,
            };

            console.log('requestBody:', requestBody);

            snap.createTransaction(requestBody)
                .then((transaction) => {
                    console.log('transaction:', transaction);
                    res.status(201).json({
                        message: 'Transaksi berhasil dibuat',
                        data: transaksiData,
                        midtransResponse: transaction
                    });
                }
                ).catch((error) => {
                    console.error('Error creating Midtrans transaction:', error);
                    throw error;
                });
        } catch (error) {
            console.error('Error creating Midtrans transaction:', error);
            throw error;
        }
    }

    async updateStatus(req, res) {
        const request = req.body;
        const order_id = request.order_id;

        const transaksi = await Transaksi.findOne({ kode_transaksi: order_id });

        console.log('transaksi:');

        if (transaksi && request.transaction_status === 'settlement') {
            if (request.transaction_status === 'settlement') {
                transaksi.status = 'Paid';
                transaksi.Products.forEach(product => {
                    product.status = 'Paid';
                });
            } else if (request.transaction_status === 'expire') {
                transaksi.status = 'Expired';
                transaksi.Products.forEach(product => {
                    product.status = 'Expired';
                });
            } else {
                transaksi.status = 'Failed';
                transaksi.Products.forEach(product => {
                    product.status = 'Failed';
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
        console.log('user:', user);
        const transaksi = await Transaksi.find({ user: user }).select('-status').populate('Products.ProductID');
        res.status(200).json({
            message: 'Berhasil menampilkan data transaksi Customer',
            data: transaksi
        });
    }

    async updateStatus(req, res) {
        try {
            const { productID, status, kode_transaksi } = req.body;
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
            console.log('transaksi:', transaksi);
            transaksi.Products.forEach(product => {
                if (product.ProductID.toString() === productID) {
                    console.log('product:', product.status);
                    product.status = status;
                    console.log('Transaksi Status', transaksi.status);
                    console.log(status);
                    console.log('product:', product.status);
                }
            });
            await transaksi.save();
            res.status(200).json({
                message: 'Berhasil update status transaksi',
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Gagal memproses permintaan' });
        }
    }

    async getTransaksiAdmin(req, res) {
        const adminUserID = req.user.id;
        // const transaksi = await Transaksi.find({ 'Products.ProductID.sellerID': adminUserID }).populate('Products.ProductID');
        const transaksi = await Transaksi.find({}).select('-status').populate('Products.ProductID').populate('user');

        const adminTransaksi = transaksi.filter(trx => trx.Products.some(product => product.ProductID.sellerID.toString() === adminUserID));

        res.status(200).json({
            message: 'Berhasil menampilkan data transaksi admin',
            data: adminTransaksi
        });
    }




    // async getTransaksiAdmin(req, res) {
    //     // const user = req.user || '65b93b4f3b4839656e9c05b0';
    //     const user = '65b93b4f3b4839656e9c05b0';
    //     const transaksi = await Transaksi.find({ 'Products.ProductID': '65ca7f4ec7ae57e02db10267' }).populate('Products.ProductID').populate('user');
    //     res.status(200).json({
    //         message: 'Berhasil menampilkan data transaksi',
    //         data: transaksi
    //     });
    // }
}

module.exports = new TransaksiController();