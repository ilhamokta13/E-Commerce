var express = require('express');
var router = express.Router();
const index = require('../controllers/index-controller');
const catchAsync = require('../utils/catchAsync');

/* GET home page. */
router.route('/')
  .get(catchAsync(index.index));

module.exports = router;
