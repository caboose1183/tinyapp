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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "sid"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "sid2"
  }
};

const users = {
  "sid": {
    id: "sid",
    email: "sid@example.com",
    password: "123"
  },
  "sid2": {
    id: "sid2",
    email: "sid2@example.com",
    password: "testing"
  },
  "sid3": {
    id: "sid3",
    email: "bb32@example.com",
    password: "holy"
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

///////////////////////////// main pages

app.get("/urls", (req, res) => {
  let urlList = {};

  for (let smallURL in urlDatabase) {
    if (urlDatabase[smallURL].userID === req.cookies.user_id) {
      urlList[smallURL] = urlDatabase[smallURL].longURL
    }
  }

  const templateVars = {
    urls: urlList,
    user: users[req.cookies.user_id]
  };

  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };

  if (templateVars.user === undefined) {    //if not logged in , redirects to register
    return res.redirect(302, '/register');
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies.user_id]
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {                 /////////// redirect to longURL
  const longURL = urlDatabase[req.params.shortURL].longURL

  console.log (longURL)

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

app.get("/login", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies.user_id]
  };

  res.render("login", templateVars);
});


////////////////////////////////POST requests



app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]

  res.redirect(302, `/urls`);
});

app.post("/urls/:shortURL", (req, res) => {         //from index, redirects to show

  res.redirect(302, `/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/edit", (req, res) => {             ///edit longURL, same shortURL
  urlDatabase[req.params.shortURL].longURL = req.body.longURL

  res.redirect(302, `/urls`);
});

app.post("/urls", (req, res) => {             ////create new shortURLS
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.cookies.user_id}

  res.redirect(302, `/urls/${shortURL}`);
});

app.post("/login", (req, res) => {                       /////////new login page logic
  if (!doesEmailExist(req.body.email, users)) {
    return res.send('Error 403, email cannot be found');
  }

  if (doesEmailExist(req.body.email, users)) {

    for (let user in users) {
      if (req.body.password === users[user].password) {
        res.cookie('user_id', users[user].id)

        return res.redirect(302, `/urls`);
      }
    }
  }

  res.send('Error 403, incorrect password');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id')

  res.redirect(302, `/urls`);
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    return res.send('Error 400');
  };

  if (doesEmailExist(req.body.email, users)) {
    return res.send('Error 400, email already exists');
  }

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

function doesEmailExist(email, userList) {
  for (let id in userList) {
    if (userList[id].email === email) {
      return true;
    }
  }

  return false;
}




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});