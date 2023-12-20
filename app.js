const express = require('express');
const connectToDatabase = require('./utils/db-connection');
const setupMiddleware = require('./utils/middleware');
const ExpressError = require('./utils/ExpressError');
const indexRoutes = require('./routes/index');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectToDatabase();

// Setup Middleware
setupMiddleware(app);

// Routes
app.use('/', indexRoutes);

// Error route
app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404));
});

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Oh No, Something Went Wrong!';
  res.status(statusCode).render('error', { err });
});

// Listen to Port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;


// TODO without utils
// require('dotenv').config();
// const express = require('express');
// const app = express();
// const mongoose = require('mongoose');
// const methodOverride = require('method-override');
// const cookieParser = require('cookie-parser');
// const path = require('path');
// const ExpressError = require('./utils/ExpressError');
// const ejsMate = require('ejs-mate')

// const port = process.env.PORT || 3000;
// const url = process.env.DB_CONNECTION || 'mongodb://localhost:27017/test';

// // Connect to MongoDB
// mongoose.connect(url, {
//   serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
// })
//   .then(() => {
//     console.log('Mongo Connection Open');
//   })
//   .catch(err => {
//     console.log('Mongo Connection Error');
//     console.error(err);
//   });

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(methodOverride('_method'));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// // View engine setup
// app.engine('ejs', ejsMate);
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// // Routes
// const index = require('./routes/index');
// app.use('/', index);

// // Error route
// app.all('*', (req, res, next) => {
//   next(new ExpressError('Page Not Found', 404));
// });

// // Error handler
// app.use((err, req, res, next) => {
//   const { statusCode = 500 } = err;
//   if (!err.message) err.message = 'Oh No, Something Went Wrong!';
//   res.status(statusCode).render('error', { err });
// });

// // Listen to Port
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

// module.exports = app;
