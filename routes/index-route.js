var express = require('express');
var router = express.Router();
const index = require('../controllers/index-controller');
const catchAsync = require('../utils/catchAsync');

router.get('/', (req, res) => {
  console.log('masuk index');
  // Your other logic for handling the request goes here
  res.send('Hello, this is the home page!');
});

module.exports = router;
