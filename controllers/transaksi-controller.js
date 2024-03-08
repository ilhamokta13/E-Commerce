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
        // res.status(201).json({
        //     message: 'Transaksi berhasil dibuat',
        //     data: newTransaksi,
        //     midtransResponse: midtransResponse
        // });
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


            // const grossAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);
            // console.log('grossAmount:', grossAmount);

            const total = items.reduce((total, item) => total + (item.price * item.quantity), 0);
            console.log('ORDER_UNIQUE', transaksiData.kode_transaksi.toString());

            const requestBody = {
                transaction_details: {
                    order_id: 'CustOrder-' + transaksiData._id.toString(),
                    gross_amount: total
                },
                item_details: items,
            };
            console.log('requestBody:', requestBody);
            snap.createTransaction(requestBody)
                .then((transaction) => {
                    console.log('transaction:', transaction);
                    return transaction;
                })
                .catch((error) => {
                    console.error('Error creating Midtrans transaction:', error);
                    throw error;
                });

            const response = await axios.post(midtransBaseUrl, requestBody, { headers });

            return res.status(201).json({
                message: 'Transaksi berhasil dibuat',
                data: transaksiData,
                midtransResponse: response.data
            });
        } catch (error) {
            console.error('Error creating Midtrans transaction:', error);
            throw error;
        }
    }

    async getAllTransaksi(req, res) {
        const transaksi = await Transaksi.find({}).populate('Products.ProductID');
        res.status(200).json({
            message: 'Berhasil menampilkan data transaksi',
            data: transaksi
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