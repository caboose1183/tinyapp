///////////required modules and imports
const express = require("express");
const app = express();
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

//////setting view engine
app.set("view engine", "ejs");

//////using parsers and cookies
app.use(bodyParser.urlencoded({ extended: true }));
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
  }
};

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

app.get("/urls", (req, res) => {
  const urlList = urlsForUser(req.session.user_id, urlDatabase);

  const urlsInfo = {
    urls: urlList,
    shortURL: '',
    user: users[req.session.user_id],
    access: ''
  };

  res.render('urls_index', urlsInfo);
});

app.get("/urls/new", (req, res) => {
  const urlsInfo = {
    urls: urlDatabase,
    user: users[req.session.user_id],
    access: ''
  };

  if (urlsInfo.user === undefined) {
    return res.redirect(302, '/login');
  }

  res.render("urls_new", urlsInfo);
});

app.get("/urls/:shortURL", (req, res) => {
  const urlList = urlsForUser(req.session.user_id, urlDatabase);

  //changes value of appropriate key when shortURL is invalid
  if (req.params.shortURL < 6 || urlDatabase[req.params.shortURL] == undefined) {
    const urlsInfo = {
      urlDatabase: urlDatabase,
      urls: urlList,
      shortURL: 'invalid',
      longURL: '',
      user: users[req.session.user_id],
      access: ''
    };

    return res.render("urls_index", urlsInfo);
  }

  const urlsInfo = {
    urlDatabase: urlDatabase,
    urls: urlList,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id],
    access: ''
  };

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    urlsInfo.access = 'denied'

    return res.render("urls_index", urlsInfo);
  }

  res.render("urls_show", urlsInfo);
});

app.get("/u/:shortURL", (req, res) => {                //
  const urlList = urlsForUser(req.session.user_id, urlDatabase);

  //changes value of appropriate key when shortURL is invalid
  if (req.params.shortURL < 6 || urlDatabase[req.params.shortURL] == undefined) {
    const urlsInfo = {
      urlDatabase: urlDatabase,
      urls: urlList,
      shortURL: 'invalid',
      longURL: '',
      user: users[req.session.user_id],
      access: ''
    };

    return res.render("urls_index", urlsInfo);
  }

  const urlsInfo = {
    urlDatabase: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id],
    access: ''
  };

  const longURL = urlDatabase[req.params.shortURL].longURL;

  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const urlsInfo = {
    urlDatabase: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.session.user_id],
    access: ''
  };

  res.render("register", urlsInfo);
});

app.get("/login", (req, res) => {
  const urlsInfo = {
    urlDatabase: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.session.user_id],
    access: ''
  };

  res.render("login", urlsInfo);
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

app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === undefined) {
    return res.send('Error 400: Please login');
  }

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.send('Error 400: tiny URL does not belong to user');
  }

  res.redirect(302, `/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL

  res.redirect(302, `/urls`);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };

  res.redirect(302, `/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  const email = getUserByEmail(req.body.email, users);

  if (email === undefined) {
    return res.send('Error 403, email cannot be found');
  }

  if (email) {
    for (const user in users) {
      if (bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session.user_id = users[user].id;

        return res.redirect(302, `/urls`);
      }
    }
  }
  res.send('Error 403, incorrect password');
});

app.post("/logout", (req, res) => {
  req.session = null;

  res.redirect(302, `/urls`);
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {

    const registerInfo = {
      user: '',
      email: ''
    };

    return res.render("register", registerInfo);
  };

  for (const user in users) {
    if (req.body.email === users[user].email) {
      const registerInfo = {
        user: '',
        email: 'exists'
      }

      return res.render("register", registerInfo);
    }
  };

  const id = generateRandomString();

  users[id] = {
    'id': id,
    'email': req.body.email,
    'password': bcrypt.hashSync(req.body.password, 10)
  };

  req.session.user_id = id;
  res.redirect(302, `/urls`);
});

//////////////////server listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});