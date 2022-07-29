//jshint esversion:6

const express = require("express");
const _ = require("lodash");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require('mongoose');
const User = require('./model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk'
const request = require("request");
const fetch = require("node-fetch");
var rating=0;

const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";


mongoose.connect("mongodb://localhost:27017/loginDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const composeSchema = ({
  title: String,
  body: String,
  link: String
});
const Blog = new mongoose.model("Blog", composeSchema);
const homeStartingContent = new Blog({
  title: "Home",
  body: "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.",
  link: "home"
});
Blog.find({}, function(err, found) {
  if (found.length === 0) {
    homeStartingContent.save();
  }
  // console.log("Success");
});

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.get("/", function(req, res) {
  res.render("login");
});
app.get("/signup", function(req, res) {
  res.render("signup");
});

app.post("/search", function(req, res) {
  hotelName = req.body.hotelName;
  Blog.find({}, function(err, found) {
    res.render("review", {
      content: found,
      hotelName: hotelName
    });
  });
});
app.get("/compose", function(req, res) {
  res.render("compose",{rating:0});
});

app.get("/contact",function(req,res){
  res.render("contact",{contactContent:contactContent});
});

app.post("/compose", async(req, res)=> {
  const post = new Blog({
    title: req.body.postTitle,
    body: req.body.postBody,
    link: _.lowerCase(req.body.postTitle)
  });
  post.save();
  const data = {
    text: req.body.postBody
  };
  const response = await fetch("https://hotel-rating.herokuapp.com/rating", {
    method: 'post',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data1 = await response.json();
  // console.log(data1);
  rating=JSON.parse(data1).result[0];
  // console.log(typeof rating);
  // console.log(data1.result[0]);
  // console.log(rating);
  // res.render("compose",{rating:rating});
  res.render("rating",{rating:rating});
});

app.post("/signup", async (req, res) => {
  username = req.body.username;
  plainTextPassword = req.body.pass;

  if (!username || typeof username !== 'string') {
    return res.json({
      status: 'error',
      error: 'Invalid username'
    })
  }

  if (!plainTextPassword || typeof plainTextPassword !== 'string') {
    return res.json({
      status: 'error',
      error: 'Invalid password'
    })
  }

  if (plainTextPassword.length < 5) {
    return res.json({
      status: 'error',
      error: 'Password too small. Should be atleast 6 characters'
    })
  }

  password = await bcrypt.hash(plainTextPassword, 10);

  try {
    const response = await User.create({
      username,
      password
    })
    console.log('User created successfully: ', response)
  } catch (error) {
    if (error.code === 11000) {
      // duplicate key
      return res.json({
        status: 'error',
        error: 'Username already in use'
      })
    }
    throw error
  }
  res.redirect("/");
  // res.json({
  //   status: 'ok'
  // })
  // console.log(password);
  // console.log(await bcrypt.hash(password,10));
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.pass;
  const user = await User.findOne({
    username
  }).lean()

  if (!user) {
    return res.json({
      status: 'error',
      error: 'Invalid username/password'
    })
  }

  if (await bcrypt.compare(password, user.password)) {
    // the username, password combination is successful

    const token = jwt.sign({
        id: user._id,
        username: user.username
      },
      JWT_SECRET
    )

    // return res.json({
    //   status: 'ok'
    // })
    res.render("home");
  } else {
    return res.json({
      status: 'error',
      error: 'Invalid username/password'
    })
  }

});


app.listen(3000, function() {
  console.log("Server has startrd Successfully");
});
