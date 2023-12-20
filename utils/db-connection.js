const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.DB_CONNECTION || 'mongodb://localhost:27017/test';

const connectToDatabase = async () => {
  try {
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    console.log('Mongo Connection Open');
  } catch (err) {
    console.log('Mongo Connection Error');
    console.error(err);
  }
};

module.exports = connectToDatabase;
