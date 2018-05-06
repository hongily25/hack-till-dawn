const express = require('express')
const path = require('path')
const request = require('request')
const PORT = process.env.PORT || 5000
const multer = require('multer')
var mongo = require('mongodb')
var MongoClient = require('mongodb').MongoClient
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
var userID = 25;
var url = "mongodb+srv://emily:Kurama!25@cluster0-gygul.mongodb.net/test";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  var dbo = db.db("mydb");
  dbo.createCollection("customers", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});


express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => {
    res.render('pages/index', { message: "", noName: ""})
  })
  .get('/user', (req, res) => {
    MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("mydb");
  dbo.collection("customers").find({}).toArray(function(err, result) {
    if (err) throw err;
    res.send(result);
    console.log(result);
    db.close();
  });
});
  })
  .get('/user/:name', (req,res) => {
    console.log('req.params.name', req.params.name);
    var fullName = req.params.name;
    arrayName = fullName.split(" ");
    var first = arrayName[0];
    var last = arrayName[1];
    if(req.params.name) {
      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var query = { firstName: first, lastName: last};
        dbo.collection("customers").find(query).toArray(function(err, result) {
          if (err) throw err;
          console.log(result);
          db.close();
          res.send(result);
        });
      });
    } else res.send('hello world')
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
      headers: {
        'Content-Type': 'application/json'
      },
      url: 'https://j6bfr3m640.execute-api.us-east-1.amazonaws.com/Prod/recall/api/index-face',
      body: JSON.stringify(formData)
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        return console.error('upload failed:', err);
        res.send("sorry there was an error");
      }
      console.log('httpResponse.statusCode', httpResponse.statusCode);
      
      var info = JSON.parse(body);
      userID = info.UserId;

      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var myobj = { firstName: req.body.firstName, lastName: req.body.lastName, UserId: userID };
        dbo.collection("customers").insertOne(myobj, function(err, res) {
          if (err) throw err;
          console.log("1 document inserted");
          db.close();
        });
      });

      console.log('info', info);
      res.render('pages/db', { firstName: req.body.firstName, lastName: req.body.lastName, fileUrl: req.files.avatar[0].filename, userID: userID})
    });
})
  .get('/oauth', (req, res) => {
    console.log('req.params', req.params);
    res.send('oauth')
  })
  .get('/video', (req, res) => {
    res.render('pages/video')
  })
  .get('/download', function(req, res){
    var file = __dirname + '/public/FullTarty.mp4';
    res.download(file); // Set disposition and send it.
  })
  .get('/prevideo', function(req, res){
    res.render('pages/prevideo') // Set disposition and send it.
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
