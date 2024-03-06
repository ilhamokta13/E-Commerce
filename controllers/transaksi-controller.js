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
        });
        console.log(products.map((product, index) => ({
            productID: product._id,
            quantity: jumlah[index],
            payment_status: 'pending'
        })));
        const newTransaksi = new Transaksi({
            user: user,
            Products: products.map((product, index) => ({
                ProductID: product._id,
                quantity: jumlah[index]
            })),
            total: total_harga
        });
        await newTransaksi.save();

        const midtransResponse = await TransaksiController.createMidtransTransaction(newTransaksi);
        res.status(201).json({
            message: 'Transaksi berhasil dibuat',
            data: newTransaksi,
            midtransResponse: midtransResponse
        });
    }

    static async createMidtransTransaction(transaksiData) {
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

            const items = transaksiData.Products.map(product => ({
                id: product.ProductID.toString(),
                price: product.price,
                quantity: product.quantity,
                name: product.name
            }));

            const requestBody = {
                transaction_details: {
                    order_id: transaksiData._id, // Ganti dengan ID transaksi Anda
                    gross_amount: 1000 // Ganti dengan total harga transaksi Anda
                },
                item_details: [{
                    id: transaksiData._id,
                    price: transaksiData.total,
                    quantity: 1,
                    name: 'Pembayaraaaan111'
                },
                {
                    id: transaksiData._id,
                    price: transaksiData.total,
                    quantity: 1,
                    name: 'Pembayaraaaan22'
                },]
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


            // const requestBody = {
            //     transaction_details: {
            //         order_id: transaksiData._id, // Ganti dengan ID transaksi Anda
            //         gross_amount: transaksiData.total // Ganti dengan total harga transaksi Anda
            //     },
            //     item_details: items,
            // customer_details: {
            //     // Ganti dengan informasi pelanggan jika diperlukan
            // },
            // credit_card: {
            //     // Ganti dengan konfigurasi kartu kredit jika diperlukan
            // },
            // // Tambahkan konfigurasi lainnya sesuai kebutuhan


            const response = await axios.post(midtransBaseUrl, requestBody, { headers });

            return response.data;
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