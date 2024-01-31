const express = require('express');
const connectToDatabase = require('./utils/db-connection');
const setupMiddleware = require('./utils/middleware');
const ExpressError = require('./utils/ExpressError');
const indexRoutes = require('./routes/index');
const userRoutes = require('./routes/user-route');
const productRoutes = require('./routes/product-route');
const swagger = require('./swagger')

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectToDatabase();

// Setup Middleware
setupMiddleware(app);

// Swagger
app.use('/api-docs', swagger.serve, swagger.setup);

// Routes
app.use('/', indexRoutes);
app.use('/user', userRoutes);
app.use('/product', productRoutes);

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
