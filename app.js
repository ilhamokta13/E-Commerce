const express = require('express');
const router = express.Router();
const connectToDatabase = require('./utils/db-connection');
const { setupMiddleware } = require('./utils/middleware');
const ExpressError = require('./utils/ExpressError');
const swagger = require('./swagger')
const app = express();






// const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
// const { createServer } = require("http");

// const socket = require("./utils/socket");
// require("dotenv").config();

// const server = createServer(app);
// const io = socket.init(server);

// Routes
// const aaa = require('./routes/index-route');
const userRoutes = require('./routes/user-route');
const productRoutes = require('./routes/product-route');
const adminRoutes = require('./routes/admin-route');
const cartRoutes = require('./routes/cart-route');
const transaksiRoutes = require('./routes/transaksi-route');



const port = process.env.PORT || 3000;

// Connect to MongoDB
connectToDatabase();

// Setup Middleware
setupMiddleware(app);

// Swagger
app.use('/api-docs', swagger.serve, swagger.setup);

// Middleware for logging
// app.use((req, res, next) => {
//   console.log(req.url);
//   next();
// });

// Routes
// app.use('/', aaa);
app.use('/user', userRoutes);
app.use('/product', productRoutes);
app.use('/cart', cartRoutes);
app.use('/admin', adminRoutes);
app.use('/transaksi', transaksiRoutes);


require('dotenv').config();




// app.use(
//   cors({
//     credentials: true,
//     origin: "http://localhost:8000",
//   })
// );

// app.use(bodyParser.json());
// app.use(cookieParser());

app.use("/api", router);

// io.on("connection", (socket) => {
//   console.log("a user connected");
// });




// Error route
app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404));
});

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Oh No, Something Went Wrong!';
  res.status(statusCode).json({ error: err.message });
});

// Listen to Port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
