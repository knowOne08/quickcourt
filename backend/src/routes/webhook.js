const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// This route will receive the raw request body.
router.post('/', paymentController.handleWebhook);

module.exports = router;