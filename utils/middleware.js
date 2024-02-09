
const express = require('express');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const path = require('path');
const ejsMate = require('ejs-mate');
const jwt = require('jsonwebtoken');
const Product = require('../models/product-schema');

const setupMiddleware = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride('_method'));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  // app.use(express.static(path.join(__dirname, '../uploads')));

  app.engine('ejs', ejsMate);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));
};

const checkAuth = (req, res, next) => {
  console.log(req.headers.authorization);
  if (req.headers.authorization.split(' ')[0] === 'Bearer') {

    const payload = jwt.verify(req.headers.authorization.split(' ')[1], process.env.SECRET_KEY);
    req.user = payload;
    next();
  } else {
    res.status(401).json({
      message: 'Unauthorized'
    });
  }
}

const checkAuthor = (req, res, next) => {
  if (req.user.role === 'Seller') {
    next();
  } else {
    res.status(401).json({
      message: 'Unauthorized'
    });
  }
}

const checkOwnerProduct = async (req, res, next) => {
  if (req.user.role === 'Seller') {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (product.sellerID.toString() === req.user.id) {
      next();
    } else {
      res.status(401).json({
        message: 'Unauthorized 1'
      });
    }
  } else {
    res.status(401).json({
      message: 'Unauthorized 2'
    });
  }
}

module.exports = {
  setupMiddleware,
  checkAuth,
  checkAuthor,
  checkOwnerProduct
};

