const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

/////////////////////////global values

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "sid": {
    id: "sid",
    email: "sid@example.com",
    password: "purple-monkey-dinosaur"
  },
  "sid2": {
    id: "sid2",
    email: "sid2@example.com",
    password: "dishwasher-funk"
  }
}

/////////////////////////////// GET requests

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies.user_id]
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]

  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies.user_id]
  };

  res.render("register", templateVars);
});


////////////////////////////////POST requests



app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]

  res.redirect(302, `/urls`);
});

app.post("/urls/:shortURL", (req, res) => {         //from index, redirects to show

  res.redirect(302, `/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL

  res.redirect(302, `/urls`);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = req.body.longURL;

  res.redirect(302, `/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username)

  res.redirect(302, `/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id')

  res.redirect(302, `/urls`);
});

app.post("/register", (req, res) => {
  let id = generateRandomString();

  users[id] = {
    'id': id,
    'email': req.body.email,
    'password': req.body.password
  };

  res.cookie('user_id', id);
  res.redirect(302, `/urls`);
});






function generateRandomString() {
  let codeList = ['a', 'b', 'c', 'd', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  let shortURL = '';

  for (let i = 0; i < 6; i++) {
    let randomNum = Math.round((Math.random() * 36));
    shortURL += codeList[randomNum];
  };

  return shortURL;
};




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});