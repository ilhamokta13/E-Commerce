
const express = require('express');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const path = require('path');
const ejsMate = require('ejs-mate');

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

module.exports = setupMiddleware;
