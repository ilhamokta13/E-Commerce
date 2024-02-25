const cart = require('../models/cart-schema');

class cartController {
    static async getCart(req, res) {
        try {
            const userID = req.user.id;
            const userCart = await cart.findOne({ userID: userID }).populate('products.productID');
            res.status(200).json({
                message: 'Get cart',
                data: userCart
            });
        }
        catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    static async addToCart(req, res) {
        const userID = req.user.id;
        const { productID, quantity } = req.body;

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
                await userCart.save();
            } else {
                // Jika keranjang pengguna belum ada, buat keranjang baru
                const newCart = new cart({ userID, products: newProducts });
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
}

module.exports = cartController;