const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartSchema = new Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    products: [{
        productID: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
        },
        quantity: {
            type: Number,
            required: true,
        },
    }],

    destination: {
        latitude: {
            type: Number,
        },
        longitude: {
            type: Number,
        }
    },
    shippingCost: {
        type: Number,
        default: 0,
    }

    
});

module.exports = mongoose.model('Cart', CartSchema);