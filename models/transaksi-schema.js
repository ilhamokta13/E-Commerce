const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const TransaksiSchema = new Schema({
    userId: {
        type: String,
        ref: 'User',
    },
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
            enum: ['Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan', 'Paid', 'Pending', 'CashOnDelivery'],
            default: 'Pending',
        },
        image: {
            type: String,
        },
    }],
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan', 'Paid', 'Pending', 'CashOnDelivery'],
        default: 'Pending',
    },


    shippingCost: {
        type: Number,
        default: 0,
    },
    destination: {
        latitude: {
            type: Number,
        
        },
        longitude: {
            type: Number,
        },
    },

  

   


    
});

module.exports = mongoose.model('Transaksi', TransaksiSchema);