const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const TransaksiSchema = new Schema({
    kode_transaksi: {
        type: String,
        required: true,
        unique: true,
    },
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
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending',
        },
    }],
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'On Delivery', 'Delivered', 'Expired', 'Failed'],
        default: 'Pending',
    },
});

module.exports = mongoose.model('Transaksi', TransaksiSchema);