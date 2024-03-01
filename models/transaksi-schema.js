const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const TransaksiSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    Products: [{
        ProductID:
        {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
    }],
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', , 'Process', 'Delivery', 'Success', 'Failed'],
        default: 'Pending',
    },
});

module.exports = mongoose.model('Transaksi', TransaksiSchema);