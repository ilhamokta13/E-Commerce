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

    static async getCart(req, res) {
        try {
            const userID = req.user.id;
            const userCart = await cart.findOne({ userID: userID }).populate('products.productID');
            
            // Ubah data ke dalam format list
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
                data: [responseData] // Bungkus data dalam list
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

    static async updateCart(req, res) {
        try {
            const userID = req.user.id;
            const { productID, quantity } = req.body;

            const userCart = await cart.findOne({ userID: userID });

            if (userCart) {
                for (let i = 0; i < productID.length; i++) {
                    const productIndex = userCart.products.findIndex(product => product.productID == productID[i]);

                    if (productIndex >= 0) {
                        if (quantity[i] == 0) {
                            console.log('masuk sini');
                            userCart.products.splice(productIndex, 1);
                        }
                        else {
                            userCart.products[productIndex].quantity = quantity[i];
                        }
                    }
                }
                await userCart.save();
            }

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
        const FREE_SHIPPING_LATITUDE = -7.9469;
        const FREE_SHIPPING_LONGITUDE = 112.6161;

        // Check if the destination is the free shipping location
        if (cart.destination.latitude === FREE_SHIPPING_LATITUDE && cart.destination.longitude === FREE_SHIPPING_LONGITUDE) {
            return 0;
        }

        if (!cart.destination.latitude || !cart.destination.longitude) {
            return 0;
        }

        const productLocation = await Product.findById(cart.products[0].productID); // Assuming all products have the same location
        const { latitude: productLatitude, longitude: productLongitude } = productLocation;

        const apiKey = 'AIzaSyC0PrXhOmCsY0W6WBWwTZpErulWQdh_Huw'; // Replace with your actual API key

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${productLatitude},${productLongitude}&destinations=${cart.destination.latitude},${cart.destination.longitude}&key=${apiKey}`;

        try {
            console.log('Request URL:', url); // Log the request URL for debugging

            const response = await axios.get(url);

            console.log('API Response:', response.data); // Log the full API response for debugging

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
        } catch (error) {
            console.error('Error fetching distance from Google Maps API', error);
            return 0;
        }
    }
    
}

module.exports = cartController;