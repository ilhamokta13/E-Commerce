const path = require('path');
const Product = require('../models/product-schema');
const User = require('../models/user-schema');
const Offer = require('../models/product-schema'); // Sesuaikan dengan path dan nama file model Offer Anda
const fs = require('fs');
const geolib = require('geolib');

class ProductController {
    static async createProduct(req, res) {
        try {
            const { nameProduct, price, description, category, releaseDate, latitude, longitude } = req.body;
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
                latitude,
                longitude
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
            // Check if there's a query parameter for search
            const { search } = req.query;
            let products;
            if (search) {
                // If search query parameter exists, perform search by search
                products = await Product.find({ nameProduct: { $regex: new RegExp(search, 'i') } }).populate('sellerID');
            } else {
                // Otherwise, get all products
                products = await Product.find().populate('sellerID');
            }
            console.log(products);
            res.status(200).json({
                message: 'Get products',
                data: products
            });
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

    static async getAdminProduct(req, res) {
        try {
            const sellerID = req.user.id;
            const products = await Product.find({ sellerID: sellerID })
                .populate('sellerID');
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
            const { nameProduct, price, description, category, releaseDate, latitude, longitude } = req.body;

            const findProduct = await Product.findById(id);
            const filePath = path.join(__dirname, `../uploads/${findProduct.image}`);
            // Check if the image file exists
            if (fs.existsSync(filePath)) {
                // Delete the image file
                fs.unlinkSync(filePath);
            } else {
                console.log("File not found:", filePath);
            }

            let newImage;
            if (req.file) {
                newImage = req.file.filename;
            } else {
                newImage = findProduct.image; // Keep the existing image if no new file uploaded
            }

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

    static async getProductsByshopName(req, res) {
        try {
            const { shopName } = req.params; // Mengasumsikan shopName dikirim sebagai parameter URL
            const shop = await User.findOne({ shopName });
            if (!shop) {
                return res.status(404).json({
                    message: 'No found Shop for this shop',
                });
            }
            const products = await Product.find({ sellerID: shop._id }).populate('sellerID');
            if (products.length === 0) {
                return res.status(404).json({
                    message: 'No products found for this shop',
                });
            }
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
        const { id } = req.params;
        const { price } = req.body;

        

        const product = await Product.findByIdAndUpdate(id, { price }, { new: true });
        if (!product) {
            return res.status(404).json({
                error: true,
                message: 'Product not found'
            });
        }

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
        const { id } = req.params; // Product ID
        const { price } = req.body; // Offered price
        const buyerID = req.user.id; // Buyer's ID

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                error: true,
                message: 'Product not found'
            });
        }

        product.offers.push({ buyerID, price });
        await product.save();

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
        const { id, offerId } = req.params; // Product ID and Offer ID
        const { status } = req.body; // 'accepted' or 'rejected'
        const sellerID = req.user.id; // Seller's ID

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                error: true,
                message: 'Product not found'
            });
        }

        if (product.sellerID.toString() !== sellerID) {
            return res.status(403).json({
                error: true,
                message: 'Not authorized'
            });
        }

        const offer = product.offers.id(offerId);
        if (!offer) {
            return res.status(404).json({
                error: true,
                message: 'Offer not found'
            });
        }

        offer.status = status;
        await product.save();

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
// Controller method
static async getOfferStatuses(req, res) {
    try {
        const { id } = req.params; // Product ID
        const sellerID = req.user.id; // Seller's ID

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                error: true,
                message: 'Product not found'
            });
        }

        if (product.sellerID.toString() !== sellerID) {
            return res.status(403).json({
                error: true,
                message: 'Not authorized'
            });
        }

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
        const buyerID = req.user.id; // Buyer's ID

        // Find all products that have offers from the specific buyer
        const products = await Product.find({ 'offers.buyerID': buyerID })
            .populate('sellerID');

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

