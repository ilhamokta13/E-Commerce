
//express: Framework web untuk Node.js.
const { response } = require('express');
//Product, cart, Transaksi: Model skema Mongoose untuk produk, keranjang belanja, dan transaksi
const Product = require('../models/product-schema');
const cart = require('../models/cart-schema')
const Transaksi = require('../models/transaksi-schema');
//axios: Library untuk melakukan HTTP requests.
const axios = require('axios');
//midtrans-client: Library untuk berintegrasi dengan layanan pembayaran Midtrans.
const midtransClient = require('midtrans-client');
//multer: Middleware untuk menangani upload file.
const multer = require('multer');
//path, fs: Modul untuk menangani path dan sistem file.
const path = require('path');
const fs = require('fs');
const geolib = require('geolib');
//admin: Modul untuk mengirim notifikasi menggunakan Firebase Cloud Messaging.
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

//Menyimpan file yang diupload di direktori uploads/.
//Menentukan ukuran maksimum file (5MB) dan jenis file yang diperbolehkan (jpeg, jpg, png).
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
        //Mengambil ID pengguna dari req.user.id.
        const user = req.user.id;
        //Mengambil data keranjang belanja pengguna dari database dan memuat detail produk dengan populate.
        const userCart = await cart.findOne({ userID: user }).populate('products.productID');

        //Mengecek apakah keranjang belanja kosong.
        if (!userCart || userCart.products.length === 0) {
            return res.status(400).json({
                message: 'Keranjang kosong atau tidak ditemukan'
            });
        }

        //Membuat objek transaksi baru dengan kode transaksi, detail produk, total harga, tujuan pengiriman, dan biaya pengiriman.
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

        //Menyimpan transaksi baru ke database.
        await newTransaksi.save();
    
        //Memuat kembali transaksi yang baru dibuat dengan detail produk.
        const populatedTransaksi = await Transaksi.findById(newTransaksi._id).populate('Products.ProductID');
        //Membuat transaksi Midtrans dengan memanggil createMidtransTransaction.
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

    //res: Objek respons dari Express.js untuk mengirimkan respons HTTP.
    //transaksiData: Data transaksi yang berisi informasi produk dan detail transaksi lainnya.
    static async createMidtransTransaction(res, transaksiData) {
        try {
            //midtransBaseUrl: URL untuk API Midtrans di lingkungan sandbox (pengujian).
            //midtransServerKey: Kunci server Midtrans yang digunakan untuk otentikasi.
            const midtransBaseUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
            const midtransServerKey = 'SB-Mid-server-eDKCIhRGlkITnvMDtUpkinKE';
            //snap: Objek klien Midtrans Snap yang diinisialisasi dengan kunci server dan pengaturan mode pengujian (bukan produksi)
    
            let snap = new midtransClient.Snap({
                isProduction: false,
                serverKey: midtransServerKey
            });

            //items: Daftar produk dalam transaksi, diambil dari transaksiData.Products. Setiap produk mencakup:
            //id: ID produk.
            //price: Harga produk.
            //quantity: Kuantitas produk.
            //name: Nama produk.
            
            const items = transaksiData.Products.map(product => ({
                id: product.ProductID._id,
                price: product.ProductID.price,
                quantity: product.quantity,
                name: product.ProductID.nameProduct
            }));
    
            // Hanya tambahkan detail biaya pengiriman jika ada
            //shippingCost: Jika biaya pengiriman ada, tambahkan sebagai item ke daftar items.
            if (transaksiData.shippingCost) {
                items.push({
                    id: 'shipping_cost',
                    price: transaksiData.shippingCost,
                    quantity: 1,
                    name: 'Shipping Cost'
                });
            }
            //total: Menghitung jumlah total harga semua item dalam transaksi
            const total = items.reduce((total, item) => total + (item.price * item.quantity), 0);

            //transactionDetails: Objek yang berisi ID pesanan (order_id) dan jumlah total (gross_amount).
    
            const transactionDetails = {
                order_id: transaksiData.kode_transaksi.toString(),
                gross_amount: total
            };

            //Membuat Body Permintaan
            //requestBody: Objek yang dikirim ke Midtrans berisi detail transaksi dan detail item.
    
            const requestBody = {
                transaction_details: transactionDetails,
                item_details: items,
            };

            //snap.createTransaction(requestBody): Membuat transaksi menggunakan Midtrans dengan mengirimkan requestBody. 
            //then: Jika transaksi berhasil dibuat, kirimkan respons dengan status 201 (Created) beserta detail transaksi.
            //catch: Jika terjadi kesalahan, lempar kesalahan tersebut untuk ditangani oleh blok catch di luar.
    
            snap.createTransaction(requestBody)
                .then((transaction) => {
                    res.status(201).json({
                        message: 'Transaksi berhasil dibuat',
                        data: transaksiData,
                        midtransResponse: transaction
                    });
                })
                //catch: Menangkap dan melempar kesalahan yang terjadi selama proses pembuatan transaksi.
                .catch((error) => {
                    throw error;
                });
                //catch: Menangkap dan melempar kesalahan yang terjadi selama proses pembuatan transaksi.
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

    
    
    //Memperbarui status transaksi berdasarkan data yang diterima dari permintaan (request) Midtrans.
    //req: Objek permintaan dari Express.js yang berisi data notifikasi dari Midtrans.
    //res: Objek respons dari Express.js untuk mengirimkan respons HTTP.
    async updateStatus(req, res) {
        //request: Menyimpan data notifikasi yang diterima dari body permintaan.
        //order_id: Mengambil order_id dari data notifikasi untuk mencari transaksi yang sesuai.
        const request = req.body;
        const order_id = request.order_id;

        //transaksi: Mencari transaksi di database menggunakan kode_transaksi yang sesuai dengan order_id dari notifikasi.
        const transaksi = await Transaksi.findOne({ kode_transaksi: order_id });

        //Kondisi: Memeriksa apakah transaksi ditemukan dan apakah status transaksi adalah 'settlement'
        //if (request.transaction_status === 'settlement'): Jika status transaksi adalah 'settlement', ubah status transaksi menjadi 'Paid' dan status setiap produk menjadi 'Paid'.
        //else if (request.transaction_status === 'expire'): Jika status transaksi adalah 'expire', ubah status transaksi menjadi 'Dibatalkan' dan status setiap produk menjadi 'Dibatalkan'.
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
            //transaksi.save(): Menyimpan perubahan status transaksi dan produk ke database.
            //res.status(200).json(...): Mengirimkan respons dengan status 200 (OK) dan data transaksi yang telah diperbarui.

            await transaksi.save();
            res.status(200).json({
                message: 'Berhasil update status transaksi',
                data: transaksi
            });
        }
        //else: Jika transaksi tidak ditemukan, kirimkan respons dengan status 400 (Bad Request) dan pesan bahwa transaksi tidak ditemukan.
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


  
    //Tujuan: Mengambil dan menampilkan data transaksi untuk pengguna yang sedang masuk (logged-in).
    //req: Objek permintaan dari Express.js yang berisi informasi tentang pengguna yang sedang masuk.
    //res: Objek respons dari Express.js untuk mengirimkan respons HTTP.
    async getTransaksiUser(req, res) {
        //user: Mengambil ID pengguna dari objek req.user. Asumsinya adalah middleware otentikasi sebelumnya telah menambahkan objek user ke req.
        const user = req.user.id;

        //Mencari semua transaksi di database yang terkait dengan ID pengguna yang sedang masuk.
        //Mencari transaksi yang memiliki user yang cocok dengan ID pengguna.
        //Melakukan populasi pada field ProductID di dalam Products untuk mengambil data lengkap produk dari koleksi terkait.
        const transaksi = await Transaksi.find({ user: user }).populate('Products.ProductID');
        //Mengirimkan respons dengan status 200 (OK) dan objek JSON yang berisi pesan sukses dan data transaksi.
        res.status(200).json({
            message: 'Berhasil menampilkan data transaksi Customer',
            data: transaksi
        });
    }

    //Memperbarui status dan, jika ada, gambar produk dalam transaksi berdasarkan data yang diterima dari permintaan.
    //req: Objek permintaan dari Express.js yang berisi data dan file yang diunggah.
    //res: Objek respons dari Express.js untuk mengirimkan respons HTTP.

    async updateStatuss(req, res) {
        try {
            //Blok try-catch: Digunakan untuk menangkap dan menangani kesalahan yang mungkin terjadi selama proses pembaruan.
            //console.log: Mencetak informasi permintaan dan file untuk tujuan debugging
            console.log('Request Body:', req.body);
            console.log('Request File:', req.file);

            //Mengambil Data dari Body Permintaan
            //Destrukturisasi: Mengambil productID, status, dan kode_transaksi dari body permintaan.
            //image: Mengambil nama file dari file yang diunggah jika ada, atau null jika tidak ada file yang diunggah. 
            //console.log: Mencetak detail kode_transaksi, productID, dan image untuk tujuan debugging.
            const { productID, status, kode_transaksi } = req.body;
            const image = req.file ? req.file.filename : null;
    
            console.log(`Kode Transaksi: ${kode_transaksi}`);
            console.log(`Product ID: ${productID}`);
            console.log(`Image: ${image}`);

            //transaksi: Mencari transaksi di database yang memiliki kode_transaksi yang sesuai dan produk dengan ProductID yang sesuai.
    
            const transaksi = await Transaksi.findOne({
                kode_transaksi: kode_transaksi,
                'Products.ProductID': productID
            });

            //Kondisi: Jika transaksi tidak ditemukan, kirimkan respons dengan status 400 (Bad Request) dan pesan bahwa transaksi tidak ditemukan.
    
            if (!transaksi) {
                return res.status(400).json({
                    message: 'Transaksi tidak ditemukan'
                });
            }

            //productUpdated: Variabel untuk melacak apakah produk telah diperbarui.
            //transaksi.Products.forEach: Melakukan iterasi melalui daftar produk dalam transaksi.
            //Kondisi: Jika ProductID produk cocok dengan productID dari permintaan, perbarui status produk dan gambar (jika ada).
    
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

            //Kondisi: Jika tidak ada produk yang diperbarui, 
            //kirimkan respons dengan status 400 (Bad Request) dan pesan bahwa produk tidak ditemukan dalam transaksi.
    
            if (!productUpdated) {
                return res.status(400).json({
                    message: 'Produk tidak ditemukan dalam transaksi'
                });
            }

            //Menyimpan Perubahan ke Database
            await transaksi.save();

            //res.status(200).json(...): Mengirimkan respons dengan status 200 (OK) dan objek JSON yang berisi pesan sukses dan data transaksi yang telah diperbarui.
    
            res.status(200).json({
                message: 'Berhasil update status transaksi',
                data: transaksi
            });

            //catch: Menangkap kesalahan yang terjadi selama proses pembaruan dan mencetaknya ke konsol.
        } catch (error) {
            console.error('Error:', error);
            //res.status(500).json(...): Mengirimkan respons dengan status 500 (Internal Server Error) dan pesan kesalahan.
            res.status(500).json({ error: 'Gagal memproses permintaan' });
        }
    }
    
    
    //Mengambil dan menampilkan data transaksi yang melibatkan produk yang dijual oleh admin.
    //req: Objek permintaan dari Express.js yang berisi informasi tentang pengguna (admin) yang sedang masuk. 
    //res: Objek respons dari Express.js untuk mengirimkan respons HTTP.
    async getTransaksiAdmin(req, res) {
        //adminUserID: Mengambil ID admin dari objek req.user. Asumsinya adalah middleware otentikasi sebelumnya telah menambahkan objek user ke req.
        const adminUserID = req.user.id;
    
        try {
            //Blok try-catch: Digunakan untuk menangkap dan menangani kesalahan yang mungkin terjadi selama proses pengambilan data. 
            //transaksi: Mencari semua transaksi di database dan melakukan populasi pada field ProductID di dalam Products dan field user untuk mengambil data lengkap produk dan pengguna dari koleksi terkait.
            const transaksi = await Transaksi.find({}).populate('Products.ProductID').populate('user');

            //adminTransaksi: Menyaring transaksi yang melibatkan produk yang dijual oleh admin
            //filter: Melakukan iterasi melalui semua transaksi.
            //isSeller: Menandakan apakah produk dalam transaksi tersebut dijual oleh admin.
            //forEach: Memeriksa setiap produk dalam transaksi untuk melihat apakah sellerID produk cocok dengan adminUserID.
    
            const adminTransaksi = transaksi.filter(trx => {
                let isSeller = false;
                trx.Products.forEach(product => {
                    if (product.ProductID && product.ProductID.sellerID && product.ProductID.sellerID.toString() === adminUserID) {
                        isSeller = true;
                    }
                });
                return isSeller;
            });

            //responseFilter: Menyusun data transaksi yang hanya berisi produk yang dijual oleh admin.
            //map: Melakukan iterasi melalui transaksi yang telah difilter.
            //products: Memfilter produk dalam transaksi untuk hanya menyertakan produk yang dijual oleh admin.
            //return: Mengembalikan objek yang berisi detail transaksi yang relevan.
    
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
             //message: Pesan notifikasi yang akan dikirim melalui FCM.
             //notification: Objek yang berisi judul dan isi pesan notifikasi.
             //topic: Mengirimkan notifikasi kepada semua pengguna yang berlangganan topik 'admin'.
             //send: Mengirim pesan notifikasi menggunakan admin.messaging() (Firebase Admin SDK).
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
            
            
                //res.status(200).json(...): Mengirimkan respons dengan status 200 (OK) dan objek JSON yang berisi pesan sukses dan data transaksi yang telah difilter.
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


   
    //Menghitung dan menampilkan pendapatan masing-masing toko berdasarkan transaksi yang selesai (dengan status tertentu).
    //req: Objek permintaan dari Express.js. res: Objek respons dari Express.js untuk mengirimkan respons HTTP.
    async getPendapatanMasingMasingToko(req, res) {
        //Blok try-catch: Digunakan untuk menangkap dan menangani kesalahan yang mungkin terjadi selama proses agregasi.
        //$match: Menyaring transaksi yang memiliki status 'Paid', 'Dikirim', atau 'Selesai'.
        try {
            const pendapatanDanTransaksiPerToko = await Transaksi.aggregate([
                {
                    $match: { 'status': { $in: ['Paid', 'Dikirim', 'Selesai'] } } // hanya transaksi dengan status Paid, Delivered, atau On Delivery
                },
                {
                    //$unwind: Memisahkan array Products dalam transaksi menjadi dokumen terpisah untuk setiap produk.
                    $unwind: '$Products'
                },
                {
                    //$lookup: Menggabungkan dokumen dari koleksi products berdasarkan ProductID dari Products dalam transaksi.
                    
                    $lookup: {
                        from: 'products',
                        localField: 'Products.ProductID',
                        foreignField: '_id',
                        as: 'Product'
                    }
                },
                {
                    //$unwind: Memisahkan array Product yang dihasilkan oleh $lookup menjadi dokumen terpisah.
                    $unwind: '$Product'
                },
                {
                    //Mengelompokkan Data Berdasarkan Penjual
                    //$group: Mengelompokkan data berdasarkan sellerID dari produk, menghitung total pendapatan per toko, dan menyertakan seluruh dokumen transaksi.
                    
                    $group: {
                        _id: '$Product.sellerID',
                        totalPendapatan: { $sum: { $multiply: ['$Product.price', '$Products.quantity'] } }, // menghitung total pendapatan per toko
                        transaksi: { $push: '$$ROOT' } // Menyertakan seluruh dokumen transaksi
                    }
                },
                {
                    //$match: Menyaring hasil untuk hanya menyertakan toko dengan total pendapatan lebih dari 0.
                    $match: { totalPendapatan: { $gt: 0 } } // hanya transaksi dengan total pendapatan tidak kosong
                },
                {
                    //$lookup: Menggabungkan dokumen dari koleksi users berdasarkan sellerID untuk mendapatkan informasi penjual.
                    //$unwind: Memisahkan array Seller yang dihasilkan oleh $lookup menjadi dokumen terpisah.
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
                    //$project: Menyusun hasil akhir dengan menyertakan sellerID, shopName, totalPendapatan, dan daftar transaksi.
                    $project: {
                        _id: 0,
                        sellerID: '$Seller._id',
                        shopName: '$Seller.shopName',
                        totalPendapatan: 1,
                        transaksi: 1 // Menyertakan list transaksi
                    }
                }
            ]);
    
            //res.status(200).json(...): Mengirimkan respons dengan status 200 (OK) dan objek JSON yang berisi pesan sukses dan data pendapatan serta transaksi per toko.
            //catch: Menangkap kesalahan yang terjadi selama proses agregasi dan mencetaknya ke konsol.
            //res.status(500).json(...): Mengirimkan respons dengan status 500 (Internal Server Error) dan pesan kesalahan jika terjadi.
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