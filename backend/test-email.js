const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('User:', process.env.EMAIL_USER);
console.log('Pass:', process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS.replace(/\s/g, '')
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('Error details:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});
