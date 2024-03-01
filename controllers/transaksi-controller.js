const Product = require('../models/product-schema');
const Transaksi = require('../models/transaksi-schema');
class TransaksiController {
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
            quantity: jumlah[index]
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
        res.status(201).json({
            message: 'Transaksi berhasil dibuat',
            data: newTransaksi
        });
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