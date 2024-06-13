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


  router.route('/reset-password')
  .patch(userController.resetPassword);


  router.post('/forgot-password', userController.forgotPassword);

router.post('/new-password', userController.newPassword);



// Logout
// router.route('/logout')
//   .post(userController.logout);

// Get user profile
router.route('/profile')
  .get(checkAuth, userController.getUserProfile);


// Get all user profiles
router.route('/allprofiles')
  .get(checkAuth, userController.getAllUserProfiles);









module.exports = router;
