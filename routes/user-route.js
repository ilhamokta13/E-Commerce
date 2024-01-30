const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller');

router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// Register
router.route('/register')
  .post(userController.register);

// Login
router.route('/login')
  .post(userController.login);

module.exports = router;
