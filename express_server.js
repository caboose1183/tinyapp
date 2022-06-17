///////////required modules and imports
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const { getUserByEmail } = require('./helpers');

//////setting view engine
app.set("view engine", "ejs");

//////using parsers and cookies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["why would someone eat olives"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

const PORT = 8080; // default port 8080

/////////////////////////global values

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "sid": {
    id: "sid",
    email: "sid@example.com",
    password: "purple"
  },
  "larry": {
    id: "larry",
    email: "larry@example.com",
    password: "testing"
  },
  "derek": {
    id: "derek",
    email: "derek@example.com",
    password: "holy"
  }
}

/////////////////////////////// GET requests

app.get("/", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };

  if (templateVars.user === undefined) {
    return res.redirect('/login');
  }

  if (templateVars.user !== undefined) {
    return res.redirect('/urls');
  }

  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {                //main URL page
  let urlList = urlsForUser(req.session.user_id)

  const templateVars = {
    urls: urlList,
    user: users[req.session.user_id]
  };

  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  if (templateVars.user === undefined) {    //if not logged in , redirects to register
    return res.redirect(302, '/login');
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {    //url of shortURL
  const templateVars = {
    urlDatabase: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id],
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {                 // redirect to longURL
  if (req.params.shortURL.length < 6 || urlDatabase[req.params.shortURL] === undefined) {
    return res.send('Error 400, tiny URL does not exist.');
  }

  const templateVars = {
    urlDatabase: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  };

  const longURL = urlDatabase[req.params.shortURL].longURL;

  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = {
    urlDatabase: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.session.user_id],
  };

  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    urlDatabase: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.session.user_id]
  };

  res.render("login", templateVars);
});

////////////////////////////////POST requests

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === undefined) {
    return res.send('Error 400: Please login');
  }

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.send('Error 400: tiny URL does not belong to user');
  }

  delete urlDatabase[req.params.shortURL];

  res.redirect(302, `/urls`);
});

app.post("/urls/:shortURL", (req, res) => {         //from index, redirects to show
  if (req.session.user_id === undefined) {
    return res.send('Error 400: Please login');
  }

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.send('Error 400: tiny URL does not belong to user');
  }

  res.redirect(302, `/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/edit", (req, res) => {             //edit longURL, same shortURL
  urlDatabase[req.params.shortURL].longURL = req.body.longURL

  res.redirect(302, `/urls`);
});

app.post("/urls", (req, res) => {             //create new shortURLS
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };

  res.redirect(302, `/urls/${shortURL}`);
});

app.post("/login", (req, res) => {                       //new login page logic
  const email = getUserByEmail(req.body.email, users);

  if (email === undefined) {
    return res.send('Error 403, email cannot be found');
  }

  if (email) {
    for (let user in users) {
      if (bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session.user_id = users[user].id;

        return res.redirect(302, `/urls`);
      }
    }
  }
  res.send('Error 403, incorrect password');
});

app.post("/logout", (req, res) => {       //removes cookie info
  req.session = null;

  res.redirect(302, `/urls`);
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    const templateVars = {
      urlDatabase: urlDatabase,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL],
      user: ''
    };

    return res.render("register", templateVars);
  };

  if (doesEmailExist(req.body.email, users)) {
    const templateVars = {
      urlDatabase: urlDatabase,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL],
      user: true
    };

    return res.render("register", templateVars);
  }

  let id = generateRandomString();

  users[id] = {
    'id': id,
    'email': req.body.email,
    'password': bcrypt.hashSync(req.body.password, 10)
  };

  req.session.user_id = id;
  res.redirect(302, `/urls`);
});

////////////////functions

function generateRandomString() {
  let codeList = ['a', 'b', 'c', 'd', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  let shortURL = '';

  for (let i = 0; i < 6; i++) {
    let randomNum = Math.round((Math.random() * 36));
    shortURL += codeList[randomNum];
  };

  return shortURL;
};

function doesEmailExist(email, userList) {
  for (let id in userList) {
    if (userList[id].email === email) {
      return true;
    }
  }
  return false;
}

function urlsForUser(id) {
  let urlList = {};

  for (let smallURL in urlDatabase) {
    if (urlDatabase[smallURL].userID === id) {
      urlList[smallURL] = urlDatabase[smallURL].longURL;
    }
  }
  return urlList;
}

//////////////////server listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});