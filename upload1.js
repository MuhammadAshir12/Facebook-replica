const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')

const allowedFileTypes = 
{
  'audio/aac': 'audio',
  'audio/mp4': 'audio',
  'audio/mpeg': 'audio',
  'audio/amr': 'audio',
  'audio/ogg': 'audio',
  'text/plain': 'document',
  'application/pdf': 'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/msword': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'image/jpeg': 'image',
  'image/png': 'image',
  'video/mp4': 'video',
  'video/3gp': 'video',
  'image/webp': 'sticker',
};

const storage = multer.diskStorage
({
  destination: function (req, file, cb) 
  {
    const fileType = allowedFileTypes[file.mimetype]
    if (fileType) 
    {
      const uploadPath = path.join('uploads/post/', fileType)
      cb(null, uploadPath)
    } 
    else 
    {
      cb(null, 'uploads/post/')
    }
  },
  filename: (req, file, cb) => 
  {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext=path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix+ext)
  },
})

const upload1 = multer({ storage: storage })
exports.uploadMedia=upload1.fields([{name:'file',maxCount:5}])