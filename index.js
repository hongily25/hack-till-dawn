const express = require('express')
const path = require('path')
const request = require('request')
const PORT = process.env.PORT || 5000
const multer = require('multer')
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg')
  }
});
var upload = multer({storage: storage});
const fs = require('fs')
var cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }])

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => {
    res.render('pages/index', { message: "", noName: ""})
  })
  .post('/upload', cpUpload, function (req, res) {
    console.log('req.body', req.body);
    console.log('req.files.avatar', req.files.avatar);

    if (!req.body) {
      res.render('pages/index', { noName: "Please enter a first name and last name." })
    }

    if (!req.files.avatar) {
      res.render('pages/index', { message: "Please upload an image.", noName: ""})
    }

    var imagePath = req.files.avatar[0].path;
    var imageAsBase64 = fs.readFileSync(imagePath, 'base64');

    var formData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      image: imageAsBase64
    }

    request.post({
      url: 'https://j6bfr3m640.execute-api.us-east-1.amazonaws.com/Prod/recall/api/index-face',
      formData: formData
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        return console.error('upload failed:', err);
        res.send("sorry there was an error");
      }
      console.log('Upload successful!  Server responded with:', body);
      res.render('pages/db', { firstName: req.body.firstName, lastName: req.body.lastName, fileUrl: req.files.avatar[0].filename, base: imageAsBase64})
    });
})
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
