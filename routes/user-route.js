const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller');
const { checkAuth, checkAuthor } = require('../utils/middleware');

router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// Register
router.route('/register')
  .post(userController.register);

// Login
router.route('/login')
  .post(userController.login);

// Reset Password
router.route('/reset-password')
  .patch(checkAuth, checkAuthor, userController.resetPassword);

// Logout
// router.route('/logout')
//   .post(userController.logout);



module.exports = router;
