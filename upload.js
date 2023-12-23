const express = require('express')
const router = express.Router()
const multer = require('multer');

const allowedFileTypes = 
{
  'image/jpeg': 'image',
  'image/png': 'image',
};

const storage = multer.diskStorage
({
  destination: function (req, file, cb) 
  {
    cb(null, 'uploads/profilePics/')
  },
  
  filename: (req, file, cb) => 
  {
    cb(null, req.userId + '.' + file.originalname.split('.').pop());
  },
});

const upload = multer({ storage });
module.exports = {upload};
