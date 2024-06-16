const path = require('path');
const Product = require('../models/product-schema');
const User = require('../models/user-schema');
const Offer = require('../models/product-schema'); // Sesuaikan dengan path dan nama file model Offer Anda
const fs = require('fs');
const geolib = require('geolib');

class ProductController {
    //Fungsi ini dideklarasikan sebagai metode statis asinkron dari sebuah kelas. 
    //Metode ini menerima dua parameter: req (request) dan res (response).
    static async createProduct(req, res) {
        try {
            //Data yang diperlukan untuk membuat produk baru diekstrak dari body request (req.body) dan informasi pengguna (req.user.id).
            const { nameProduct, price, description, category, releaseDate, latitude, longitude } = req.body;
            const sellerID = req.user.id;
            console.log(sellerID);
            //Fungsi mencari ID penjual (sellerID) dalam basis data. Jika tidak ditemukan, fungsi melempar error dengan status kode 401.
            const findSellerID = await User.findById(sellerID);
            if (!findSellerID) {
                const error = new Error('Seller ID not found');
                error.statusCode = 401;
                throw error;
            }
            //Objek produk baru dibuat dengan data yang telah diekstrak, termasuk file gambar yang diunggah (disimpan dalam req.file.filename).
            const product = new Product({
                nameProduct,
                price,
                description,
                category,
                sellerID,
                releaseDate,
                latitude,
                longitude
            });
            product.image = req.file.filename;
            console.log(product);
            //Objek produk disimpan ke basis data.
            await product.save();

            //Jika produk berhasil dibuat dan disimpan, 
            //server mengirimkan respons dengan status kode 201 dan pesan sukses beserta data produk yang baru ditambahkan.

            res.status(201).json({
                message: 'Product added',
                data: product
            });

            //Jika terjadi kesalahan selama eksekusi fungsi, blok catch akan menangkapnya dan mengirimkan respons dengan status kode 500 beserta pesan error.
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    //Fungsi ini dideklarasikan sebagai metode statis asinkron dari sebuah kelas. 
    //Metode ini menerima dua parameter: req (request) dan res (response).

    static async getAllProduct(req, res) {
        try {
            // Check if there's a query parameter for search
            //Fungsi mengekstrak parameter search dari query string pada request (req.query).
            const { search } = req.query;
            let products;
            //Jika Parameter search Ada: Jika parameter search ada, fungsi melakukan pencarian produk berdasarkan nama produk (nameProduct) yang sesuai dengan ekspresi reguler (regex) yang dibuat dari nilai search. Pencarian ini tidak peka terhadap huruf besar atau kecil (i untuk case-insensitive). Produk yang ditemukan juga akan dipopulasi dengan informasi penjual (populate('sellerID')).
            //Jika Parameter search Tidak Ada:Jika parameter search tidak ada, fungsi mengambil semua produk yang tersedia dalam basis data dan mempopulasi informasi penjualnya.
            if (search) {
                // If search query parameter exists, perform search by search
                products = await Product.find({ nameProduct: { $regex: new RegExp(search, 'i') } }).populate('sellerID');
            } else {
                // Otherwise, get all products
                products = await Product.find().populate('sellerID');
            }
            //Produk yang ditemukan dicetak ke konsol untuk debugging, kemudian mengirimkan respons dengan status kode 200 dan data produk yang ditemukan.
            console.log(products);
            res.status(200).json({
                message: 'Get products',
                data: products
            });
            //Jika terjadi kesalahan selama eksekusi fungsi, blok catch akan menangkapnya dan mengirimkan respons dengan status kode 500 beserta pesan error.
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }


    //TODO without search
    // static async getAllProduct(req, res) {
    //     try {
    //         const products = await Product.find().populate('sellerID');
    //         console.log(products);
    //         res.status(200).json({
    //             message: 'Get all products',
    //             data: products
    //         });
    //     } catch (error) {
    //         res.status(500).json({
    //             error: true,
    //             message: error.message
    //         });
    //     }
    // }

    //Fungsi ini dideklarasikan sebagai metode statis asinkron dari sebuah kelas. Metode ini menerima dua parameter: req (request) dan res (response).

    static async getAdminProduct(req, res) {
        try {
            //Fungsi mengekstrak ID penjual dari objek req.user, yang diasumsikan sudah diisi oleh middleware autentikasi.
            const sellerID = req.user.id;
            //Fungsi mencari semua produk yang terkait dengan sellerID yang diperoleh. Fungsi populate('sellerID') digunakan untuk memuat informasi penjual dalam objek produk yang ditemukan.
            const products = await Product.find({ sellerID: sellerID })
                .populate('sellerID');
            //Produk yang ditemukan dicetak ke konsol untuk tujuan debugging, kemudian mengirimkan respons dengan status kode 200 dan data produk yang ditemukan.
            console.log(products);
            res.status(200).json({
                message: 'Get all products',
                data: products
            });
            //Jika terjadi kesalahan selama eksekusi fungsi, blok catch akan menangkapnya dan mengirimkan respons dengan status kode 500 beserta pesan error.
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    //Fungsi ini dideklarasikan sebagai metode statis asinkron dari sebuah kelas. Metode ini menerima dua parameter: req (request) dan res (response).
    static async getProductById(req, res) {
        try {
            //Fungsi mengekstrak ID produk dari parameter URL (req.params). Dalam konteks route, ID produk biasanya disertakan dalam URL, misalnya /products/:id
            const { id } = req.params;
            //Fungsi mencari produk dalam basis data berdasarkan ID yang diperoleh. Fungsi populate('sellerID') digunakan untuk memuat informasi penjual dalam objek produk yang ditemukan.
            const product = await Product.findById(id).populate('sellerID');
            //Jika produk ditemukan, fungsi mengirimkan respons dengan status kode 200 beserta data produk yang ditemukan dan pesan sukses.
            res.status(200).json({
                message: 'Get product by id',
                data: product
            });
            //Jika terjadi kesalahan selama eksekusi fungsi (misalnya, produk dengan ID yang diberikan tidak ditemukan atau terjadi kesalahan basis data), blok catch akan menangkapnya dan mengirimkan respons dengan status kode 500 beserta pesan error.
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    //Fungsi ini dideklarasikan sebagai metode statis asinkron dari sebuah kelas. Metode ini menerima dua parameter: req (request) dan res (response).

    static async updateProduct(req, res) {
        try {
            //Fungsi mengekstrak ID produk dari parameter URL (req.params) dan data produk yang baru dari body request (req.body).
            const { id } = req.params;
            const { nameProduct, price, description, category, releaseDate, latitude, longitude } = req.body;

            //Fungsi mencari produk dalam basis data berdasarkan ID yang diperoleh.
            const findProduct = await Product.findById(id);
            //Fungsi menentukan jalur file gambar lama dari produk, mengecek apakah file tersebut ada, dan jika ada, menghapusnya. Jika tidak ditemukan, fungsi mencetak pesan ke konsol.
            const filePath = path.join(__dirname, `../uploads/${findProduct.image}`);
            // Check if the image file exists
            if (fs.existsSync(filePath)) {
                // Delete the image file
                fs.unlinkSync(filePath);
            } else {
                console.log("File not found:", filePath);
            }
            //Jika ada file gambar baru yang diunggah (req.file), maka menggunakan file tersebut. Jika tidak ada file baru yang diunggah, menggunakan gambar lama dari produk.

            let newImage;
            if (req.file) {
                newImage = req.file.filename;
            } else {
                newImage = findProduct.image; // Keep the existing image if no new file uploaded
            }
            //Fungsi memperbarui produk dalam basis data dengan data baru yang diberikan, termasuk ID penjual (sellerID) dari objek pengguna yang diautentikasi. Opsi { new: true } digunakan untuk mengembalikan dokumen produk yang telah diperbarui.
            const sellerID = req.user.id;
            const product = await Product.findByIdAndUpdate(id, {
                nameProduct,
                price,
                description,
                image: newImage,
                category,
                sellerID,
                releaseDate,
                latitude,
                longitude
            });
            //Jika produk berhasil diperbarui, fungsi mengirimkan respons dengan status kode 200 beserta data produk yang diperbarui dan pesan sukses.
            res.status(200).json({
                message: 'Update product success',
                data: product
            });
            //Jika terjadi kesalahan selama eksekusi fungsi, blok catch akan menangkapnya dan mengirimkan respons dengan status kode 500 beserta pesan error.
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }
    //Fungsi ini dideklarasikan sebagai metode statis asinkron dari sebuah kelas. Metode ini menerima dua parameter: req (request) dan res (response).
    static async deleteProduct(req, res) {
        try {
            //Fungsi mengekstrak ID produk dari parameter URL (req.params). Dalam konteks route, ID produk biasanya disertakan dalam URL, misalnya /products/:id.
            const { id } = req.params;
            //Fungsi mencari dan menghapus produk dari basis data berdasarkan ID yang diperoleh, mengembalikan objek produk yang dihapus.
            const product = await Product.findByIdAndDelete(id);
            //Fungsi mengekstrak nama file gambar dari objek produk yang dihapus, menentukan jalur lengkap file gambar, mencetak jalur tersebut ke konsol untuk tujuan debugging, dan kemudian menghapus file gambar dari sistem file menggunakan fs.unlinkSync.
            const image = product.image;
            const pathh = path.join(__dirname, `../uploads/${image}`);
            console.log(pathh);
            fs.unlinkSync(pathh);
            //Jika produk berhasil dihapus, fungsi mengirimkan respons dengan status kode 200 beserta data produk yang dihapus dan pesan sukses.
            res.status(200).json({
                message: 'Delete product success',
                data: product
            });
            //Jika produk berhasil dihapus, fungsi mengirimkan respons dengan status kode 200 beserta data produk yang dihapus dan pesan sukses.
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }
    //Metode ini digunakan untuk mendapatkan semua produk berdasarkan nama toko (shopName) yang diberikan sebagai parameter URL.

    static async getProductsByshopName(req, res) {
        try {
            //Mencari toko berdasarkan shopName.
            const { shopName } = req.params; // Mengasumsikan shopName dikirim sebagai parameter URL
            const shop = await User.findOne({ shopName });
            //Jika toko tidak ditemukan, mengirimkan respons 404.
            if (!shop) {
                return res.status(404).json({
                    message: 'No found Shop for this shop',
                });
            }
            //Jika ditemukan, mencari semua produk yang terkait dengan ID penjual (sellerID) toko tersebut.
            const products = await Product.find({ sellerID: shop._id }).populate('sellerID');
            //Jika tidak ada produk yang ditemukan, mengirimkan respons 404.
            if (products.length === 0) {
                return res.status(404).json({
                    message: 'No products found for this shop',
                });
            }
            //Jika produk ditemukan, mengirimkan respons 200 beserta data produk.
            res.status(200).json({
                message: 'Get products by shop name',
                data: products
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

   
static async updateProductPrice(req, res) {
    try {
        //Mengambil ID produk dan harga baru dari request.
        const { id } = req.params;
        const { price } = req.body;
        //Mencari dan memperbarui harga produk berdasarkan ID.
        const product = await Product.findByIdAndUpdate(id, { price }, { new: true });
        //Jika produk tidak ditemukan, mengirimkan respons 404.
        if (!product) {
            return res.status(404).json({
                error: true,
                message: 'Product not found'
            });
        }
        //Jika produk ditemukan dan diperbarui, mengirimkan respons 200 beserta data produk yang diperbarui.
        res.status(200).json({
            message: 'Product price updated successfully',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
}


static async makeOffer(req, res) {
    try {
        //Mengambil ID produk dan harga penawaran dari request.
        const { id } = req.params; // Product ID
        const { price } = req.body; // Offered price
        //Mengambil ID pembeli dari pengguna yang terautentikasi.
        const buyerID = req.user.id; // Buyer's ID
        //Mencari produk berdasarkan ID.
        const product = await Product.findById(id);
        //Jika produk tidak ditemukan, mengirimkan respons 404.
        if (!product) {
            return res.status(404).json({
                error: true,
                message: 'Product not found'
            });
        }
        //Jika produk ditemukan, menambahkan penawaran ke dalam produk dan menyimpannya.
        product.offers.push({ buyerID, price });
        await product.save();
        //Mengirimkan respons 201 beserta data produk setelah penawaran ditambahkan.
        res.status(201).json({
            message: 'Offer made successfully',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
}

static async confirmOffer(req, res) {
    try {
        //Mengambil ID produk dan ID penawaran dari parameter URL.
        const { id, offerId } = req.params; // Product ID and Offer ID
        //Mengambil status baru dari request body.
        const { status } = req.body; // 'accepted' or 'rejected'
        //Mengambil ID penjual dari pengguna yang terautentikasi.
        const sellerID = req.user.id; // Seller's ID
        //Mencari produk berdasarkan ID.
        const product = await Product.findById(id);
        //Jika produk tidak ditemukan, mengirimkan respons 404.
        if (!product) {
            return res.status(404).json({
                error: true,
                message: 'Product not found'
            });
        }
        //Memeriksa apakah pengguna yang terautentikasi adalah penjual produk tersebut.
        //Jika bukan penjual, mengirimkan respons 403.
        if (product.sellerID.toString() !== sellerID) {
            return res.status(403).json({
                error: true,
                message: 'Not authorized'
            });
        }
        //Jika penawaran tidak ditemukan, mengirimkan respons 404.
        const offer = product.offers.id(offerId);
        if (!offer) {
            return res.status(404).json({
                error: true,
                message: 'Offer not found'
            });
        }
        //Jika penawaran ditemukan, memperbarui status penawaran dan menyimpannya.
        offer.status = status;
        await product.save();
        //Mengirimkan respons 200 beserta data produk setelah status penawaran diperbarui.
        res.status(200).json({
            message: 'Offer status updated successfully',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
}


// Controller method
static async getOfferStatuses(req, res) {
    try {
        //Mengambil ID produk dari parameter URL.
        const { id } = req.params; // Product ID
        //Mengambil ID penjual dari pengguna yang terautentikasi.
        const sellerID = req.user.id; // Seller's ID
        //Mencari produk berdasarkan ID.
        const product = await Product.findById(id);
        //Jika produk tidak ditemukan, mengirimkan respons 404.
        if (!product) {
            return res.status(404).json({
                error: true,
                message: 'Product not found'
            });
        }
        //Memeriksa apakah pengguna yang terautentikasi adalah penjual produk tersebut.
        //Jika bukan penjual, mengirimkan respons 403.
        if (product.sellerID.toString() !== sellerID) {
            return res.status(403).json({
                error: true,
                message: 'Not authorized'
            });
        }
        //Mengambil semua penawaran pada produk dan mengembalikannya dalam respons 200 beserta data produk.
        const offers = product.offers.map(offer => ({
            offerId: offer._id,
            status: offer.status,
            ...offer._doc // include other offer fields if necessary
        }));

        res.status(200).json({
            message: 'Get all offer statuses successfully',
            data: [
                {
                    product: {
                        id: product._id,
                        name: product.nameProduct,
                        description: product.description,
                        price: product.price,
                        // Add other product fields as necessary
                    },
                    offers: offers
                }
            ]
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
}


static async getBuyerOfferStatus(req, res) {
    try {
        //Mengambil ID pembeli dari pengguna yang terautentikasi.
        const buyerID = req.user.id; // Buyer's ID

        // Find all products that have offers from the specific buyer
        //Mencari semua produk yang memiliki penawaran dari pembeli tersebut.
        const products = await Product.find({ 'offers.buyerID': buyerID })
            .populate('sellerID');
        //Jika tidak ada produk yang ditemukan, mengirimkan respons 404.
        if (!products.length) {
            return res.status(404).json({
                error: true,
                message: 'No offers found for this buyer'
            });
        }

        // Map through the products to extract the relevant offer data
        const offersData = products.flatMap(product => 
            product.offers
                .filter(offer => offer.buyerID.equals(buyerID))
                .map(offer => ({
                    product: {
                        _id: product._id,
                        nameProduct: product.nameProduct,
                        price: product.price,
                        description: product.description,
                        // Add any other product information you want to include
                    },
                    offer: {
                        _id: offer._id,
                        price: offer.price,
                        status: offer.status
                    }
                }))
        );
        //Mengambil dan mengembalikan semua penawaran yang dibuat oleh pembeli pada produk dalam respons 200 beserta data produk terkait
        res.status(200).json({
            message: 'Get offer statuses successfully',
            data: offersData
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
}













}

module.exports = ProductController;

