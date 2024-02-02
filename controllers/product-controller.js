const path = require('path');
const Product = require('../models/product-schema');
const User = require('../models/user-schema');
const fs = require('fs');

class ProductController {

    static async createProduct(req, res) {
        try {
            const { nameProduct, price, description, category, releaseDate, location } = req.body;
            const sellerID = req.user.id;
            console.log(sellerID);
            const findSellerID = await User.findById(sellerID);
            if (!findSellerID) {
                const error = new Error('Seller ID not found');
                error.statusCode = 401;
                throw error;
            }
            const product = new Product({
                nameProduct,
                price,
                description,
                category,
                sellerID,
                releaseDate,
                location
            });
            product.image = req.file.filename;
            console.log(product);
            await product.save();

            res.status(201).json({
                message: 'Product added',
                data: product
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    static async getAllProduct(req, res) {
        try {
            const products = await Product.find().populate('sellerID');
            console.log(products);
            res.status(200).json({
                message: 'Get all products',
                data: products
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    static async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.findById(id).populate('sellerID');
            res.status(200).json({
                message: 'Get product by id',
                data: product
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    static async updateProduct(req, res) {
        try {
            const { id } = req.params;
            console.log(id);
            const { nameProduct, price, description, category, releaseDate, location } = req.body;
            const findProduct = await Product.findById(id);
            const pathh = path.join(__dirname, `../uploads/${findProduct.image}`);
            console.log(pathh);
            fs.unlinkSync(pathh);
            const newImage = req.file.filename;
            const sellerID = req.user.id;
            const product = await Product.findByIdAndUpdate(id, {
                nameProduct,
                price,
                description,
                image: newImage,
                category,
                sellerID,
                releaseDate,
                location
            });
            res.status(200).json({
                message: 'Update product success',
                data: product
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.findByIdAndDelete(id);
            const image = product.image;
            const pathh = path.join(__dirname, `../uploads/${image}`);
            console.log(pathh);
            fs.unlinkSync(pathh);
            res.status(200).json({
                message: 'Delete product success',
                data: product
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