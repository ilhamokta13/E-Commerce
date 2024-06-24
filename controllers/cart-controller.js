const cart = require('../models/cart-schema');
const geolib = require('geolib');
const axios = require('axios');
const Product = require('../models/product-schema'); // Pastikan Anda mengimpor model Produk

class cartController {
    // static async getCart(req, res) {
    //     try {
    //         const userID = req.user.id;
    //         const userCart = await cart.findOne({ userID: userID }).populate('products.productID');
    //         res.status(200).json({
    //             message: 'Get cart',
    //             data: userCart
    //         });
    //     }
    //     catch (error) {
    //         res.status(500).json({
    //             error: true,
    //             message: error.message
    //         });
    //     }
    // }

    //Penggunaan blok try-catch untuk menangani kesalahan yang mungkin terjadi selama eksekusi fungsi.
    static async getCart(req, res) {
        try {
            const userID = req.user.id;
            let userCart = await cart.findOne({ userID: userID }).populate('products.productID');

            // Filter out products that are out of stock
            userCart.products = userCart.products.filter(product => product.productID.stock > 0);

            await userCart.save();

            const responseData = {
                destination: userCart.destination,
                _id: userCart._id,
                userID: userCart.userID,
                products: userCart.products,
                shippingCost: userCart.shippingCost,
                __v: userCart.__v
            };

            res.status(200).json({
                message: 'Get cart',
                data: [responseData]
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }
    

    // static async addToCart(req, res) {
    //     const userID = req.user.id;
    //     const { productID, quantity } = req.body;

    //     // Membuat array kosong untuk menyimpan produk baru
    //     const newProducts = [];

    //     // Iterasi melalui setiap pasangan productID dan quantity
    //     for (let i = 0; i < productID.length; i++) {
    //         // Menambahkan setiap pasangan productID dan quantity ke array newProducts
    //         newProducts.push({ productID: productID[i], quantity: quantity[i] });
    //     }

    //     try {
    //         // Mencari keranjang pengguna
    //         const userCart = await cart.findOne({ userID: userID });

    //         if (userCart) {
    //             // Jika keranjang pengguna sudah ada
    //             for (let i = 0; i < newProducts.length; i++) {
    //                 const productIndex = userCart.products.findIndex(product => product.productID == newProducts[i].productID);

    //                 if (productIndex >= 0) {
    //                     // Jika produk sudah ada di keranjang, tambahkan jumlahnya
    //                     userCart.products[productIndex].quantity += parseInt(newProducts[i].quantity);
    //                 } else {
    //                     // Jika produk belum ada di keranjang, tambahkan produk baru
    //                     userCart.products.push(newProducts[i]);
    //                 }
    //             }
    //             await userCart.save();
    //         } else {
    //             // Jika keranjang pengguna belum ada, buat keranjang baru
    //             const newCart = new cart({ userID, products: newProducts });
    //             await newCart.save();
    //         }

    //         res.status(200).json({
    //             message: 'Add to cart',
    //         });
    //     } catch (error) {
    //         res.status(500).json({
    //             error: true,
    //             message: error.message
    //         });
    //     }
    // }


    
    static async addToCart(req, res) {
        const userID = req.user.id;
        const { productID, quantity, latitude, longitude } = req.body;
    
        // Membuat array kosong untuk menyimpan produk baru
        const newProducts = [];
    
        // Iterasi melalui setiap pasangan productID dan quantity
        for (let i = 0; i < productID.length; i++) {
            // Menambahkan setiap pasangan productID dan quantity ke array newProducts
            newProducts.push({ productID: productID[i], quantity: quantity[i] });
        }
    
        try {
            // Mencari keranjang pengguna
            const userCart = await cart.findOne({ userID: userID });

             for (let i = 0; i < newProducts.length; i++) {
            const productData = await Product.findById(newProducts[i].productID);

            // Periksa apakah stok cukup
            if (!productData || productData.stock < newProducts[i].quantity) {
                return res.status(400).json({
                    message: `Stok produk ${productData.nameProduct} tidak mencukupi. Stok tersedia: ${productData.stock}`,
                });
            }
        }
    
            if (userCart) {
                // Jika keranjang pengguna sudah ada
                for (let i = 0; i < newProducts.length; i++) {
                    const productIndex = userCart.products.findIndex(product => product.productID == newProducts[i].productID);
    
                    if (productIndex >= 0) {
                        // Jika produk sudah ada di keranjang, tambahkan jumlahnya
                        userCart.products[productIndex].quantity += parseInt(newProducts[i].quantity);
                    } else {
                        // Jika produk belum ada di keranjang, tambahkan produk baru
                        userCart.products.push(newProducts[i]);
                    }
                }
                
                // Update lokasi dan biaya pengiriman jika lokasi disediakan
                if (latitude && longitude) {
                    userCart.destination.latitude = latitude;
                    userCart.destination.longitude = longitude;
                    userCart.shippingCost = await cartController.calculateShippingCost(userCart);
                }
                await userCart.save();
            } else {
                // Jika keranjang pengguna belum ada, buat keranjang baru
                const newCart = new cart({
                    userID,
                    products: newProducts,
                    destination: latitude && longitude ? { latitude, longitude } : undefined,
                    shippingCost: (latitude && longitude) ? await cartController.calculateShippingCost({ destination: { latitude, longitude }, products: newProducts }) : 0
                });
                await newCart.save();
            }
    
            res.status(200).json({
                message: 'Add to cart',
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }
    
    
    static async decreaseCartItem(req, res) {
        const userID = req.user.id;
        const { productID } = req.body;

        try {
            // Mencari keranjang pengguna
            const userCart = await cart.findOne({ userID: userID });

            if (userCart) {
                // Mengecek apakah produk ada dalam keranjang
                const productIndex = userCart.products.findIndex(product => product.productID == productID);

                if (productIndex >= 0) {
                    // Periksa stok produk
                    const productData = await Product.findById(productID);
                if (!productData || productData.stock < userCart.products[productIndex].quantity) {
                    return res.status(400).json({
                        message: `Stok produk ${productData.nameProduct} tidak mencukupi. Stok tersedia: ${productData.stock}`,
                    });
                }
                    // Jika produk ditemukan dalam keranjang, kurangi jumlahnya
                    if (userCart.products[productIndex].quantity > 1) {
                        userCart.products[productIndex].quantity--;
                    } else {
                        // Jika jumlah produk sudah satu, hapus dari keranjang
                        userCart.products.splice(productIndex, 1);
                    }

                    await userCart.save();
                    res.status(200).json({
                        message: 'Decrease quantity in cart',
                    });
                } else {
                    // Jika produk tidak ditemukan dalam keranjang
                    res.status(404).json({
                        error: true,
                        message: 'Product not found in cart',
                    });
                }
            } else {
                // Jika keranjang pengguna belum ada
                res.status(404).json({
                    error: true,
                    message: 'User cart not found',
                });
            }
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }
    //Metode ini digunakan untuk memperbarui keranjang belanja pengguna yang terautentikasi dengan mengubah jumlah produk atau menghapus produk dari keranjang jika jumlahnya nol.
    static async updateCart(req, res) {
        try {
            //Fungsi mengekstrak ID pengguna dari objek req.user dan mengambil productID serta quantity dari request body.
            const userID = req.user.id;
            const { productID, quantity } = req.body;
            //Fungsi mencari keranjang belanja pengguna berdasarkan userID.
            const userCart = await cart.findOne({ userID: userID });

            if (userCart) {
                //Mencari indeks produk dalam keranjang yang sesuai dengan productID.
                for (let i = 0; i < productID.length; i++) {
                    const productIndex = userCart.products.findIndex(product => product.productID == productID[i]);

                    if (productIndex >= 0) {
                         // Periksa stok produk
                    const productData = await Product.findById(productID[i]);
                    if (!productData || productData.stock < quantity[i]) {
                        return res.status(400).json({
                            message: `Stok produk ${productData.nameProduct} tidak mencukupi. Stok tersedia: ${productData.stock}`,
                        });
                    }
                        //Jika jumlah produk adalah 0, produk dihapus dari keranjang.
                        if (quantity[i] == 0) {
                            console.log('masuk sini');
                            userCart.products.splice(productIndex, 1);
                        }
                        else {
                            //Jika jumlah produk lebih dari 0, jumlah produk diperbarui.
                            userCart.products[productIndex].quantity = quantity[i];
                        }
                    }
                }
                //Menyimpan perubahan keranjang ke basis data.
                await userCart.save();
            }
            //Mengirimkan respons dengan status kode 200 dan pesan sukses.
            res.status(200).json({
                message: 'Update cart',
            });
        }
        catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    static async deleteCart(req, res) {
        try {
            const userID = req.user.id;
            const userCart = await cart.findOne({ userID: userID });
    
            if (userCart) {
                userCart.products = []; // Mengosongkan daftar produk dalam keranjang
                userCart.destination = undefined; // Menghapus lokasi
                userCart.shippingCost = 0; // Menghapus biaya pengiriman
                await userCart.save();
            }
    
            res.status(200).json({
                message: 'Cart cleared',
            });
        }
        catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }
    
    static async calculateShippingCost(cart) {
        //Konstanta untuk Lokasi Pengiriman Gratis:
        const FREE_SHIPPING_LATITUDE = -7.9469;
        const FREE_SHIPPING_LONGITUDE = 112.6161;

        // Check if the destination is the free shipping location
        if (cart.destination.latitude === FREE_SHIPPING_LATITUDE && cart.destination.longitude === FREE_SHIPPING_LONGITUDE) {
            return 0;
        }
        //Pengecekan Ketersediaan Koordinat Tujuan
        if (!cart.destination.latitude || !cart.destination.longitude) {
            return 0;
        }
        //Asumsi bahwa semua produk dalam keranjang berasal dari lokasi yang sama. Lokasi produk diambil dari produk pertama dalam keranjang.
        const productLocation = await Product.findById(cart.products[0].productID); // Assuming all products have the same location
        const { latitude: productLatitude, longitude: productLongitude } = productLocation;

        const apiKey = 'AIzaSyC0PrXhOmCsY0W6WBWwTZpErulWQdh_Huw'; // Replace with your actual API key

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${productLatitude},${productLongitude}&destinations=${cart.destination.latitude},${cart.destination.longitude}&key=${apiKey}`;

        try {
            //Mengirimkan Permintaan ke API Google Maps
            console.log('Request URL:', url); // Log the request URL for debugging

            const response = await axios.get(url);

            console.log('API Response:', response.data); // Log the full API response for debugging
            //Memproses Respons dari API Google Maps

            if (response.data && response.data.rows && response.data.rows.length > 0 &&
                response.data.rows[0].elements && response.data.rows[0].elements.length > 0 &&
                response.data.rows[0].elements[0].distance &&
                response.data.origin_addresses && response.data.origin_addresses.length > 0 &&
                response.data.destination_addresses && response.data.destination_addresses.length > 0) {
                
                const distance = response.data.rows[0].elements[0].distance.value; // Distance in meters, 
                console.log ('Jarak lokasi adalah', distance)
                const distanceInKm = distance / 1000; // Convert to kilometers
                const shippingCost = distanceInKm * 1000; // Adjust the cost calculation as per your requirement

                return shippingCost;
            } else {
                console.error('Invalid response structure from Google Maps API', response.data);
                return 0;
            }
            //Menangani Kesalahan Permintaan API
        } catch (error) {
            console.error('Error fetching distance from Google Maps API', error);
            return 0;
        }
    }   

    // static async calculateShippingCost(cart) {
    //     // Konstanta untuk Lokasi Pengiriman Gratis:
    //     const FREE_SHIPPING_LATITUDE = -7.9469;
    //     const FREE_SHIPPING_LONGITUDE = 112.6161;
    
    //     // Check if the destination is the free shipping location
    //     if (cart.destination.latitude === FREE_SHIPPING_LATITUDE && cart.destination.longitude === FREE_SHIPPING_LONGITUDE) {
    //         return 0;
    //     }
    
    //     // Pengecekan Ketersediaan Koordinat Tujuan
    //     if (!cart.destination.latitude || !cart.destination.longitude) {
    //         return 0;
    //     }
    
    //     // Asumsi bahwa semua produk dalam keranjang berasal dari lokasi yang sama. Lokasi produk diambil dari produk pertama dalam keranjang.
    //     const productLocation = await Product.findById(cart.products[0].productID); // Assuming all products have the same location
    //     const { latitude: productLatitude, longitude: productLongitude } = productLocation;
    
    //     const apiKey = 'AIzaSyC0PrXhOmCsY0W6WBWwTZpErulWQdh_Huw'; // Replace with your actual API key
    
    //     const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${productLatitude},${productLongitude}&destinations=${cart.destination.latitude},${cart.destination.longitude}&key=${apiKey}`;
    
    //     try {
    //         // Mengirimkan Permintaan ke API Google Maps
    //         console.log('Request URL:', url); // Log the request URL for debugging
    
    //         const response = await axios.get(url);
    
    //         console.log('API Response:', response.data); // Log the full API response for debugging
    //         // Memproses Respons dari API Google Maps
    
    //         if (response.data && response.data.rows && response.data.rows.length > 0 &&
    //             response.data.rows[0].elements && response.data.rows[0].elements.length > 0 &&
    //             response.data.rows[0].elements[0].distance &&
    //             response.data.origin_addresses && response.data.origin_addresses.length > 0 &&
    //             response.data.destination_addresses && response.data.destination_addresses.length > 0) {
                
    //             const distance = response.data.rows[0].elements[0].distance.value; // Distance in meters
    //             console.log('Jarak lokasi adalah', distance);
    //             const distanceInKm = distance / 1000; // Convert to kilometers
    
    //             // Menghitung biaya pengiriman berdasarkan jarak
    //             let shippingCost;
    //             if (distanceInKm <= 1) {
    //                 shippingCost = 1000; // 1 km pertama
    //             } else if (distanceInKm <= 5) {
    //                 shippingCost = 1000 + (distanceInKm - 1) * 2000; // 1 km pertama + 4 km berikutnya
    //             } else {
    //                 shippingCost = 1000 + (4 * 2000) + (distanceInKm - 5) * 3000; // 1 km pertama + 4 km berikutnya + km sisanya
    //             }
    
    //             return shippingCost;
    //         } else {
    //             console.error('Invalid response structure from Google Maps API', response.data);
    //             return 0;
    //         }
    //         // Menangani Kesalahan Permintaan API
    //     } catch (error) {
    //         console.error('Error fetching distance from Google Maps API', error);
    //         return 0;
    //     }
    // }
    
    
}

module.exports = cartController;