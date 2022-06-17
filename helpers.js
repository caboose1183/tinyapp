const getUserByEmail = function (email, database) {
  for (let user in database) {
    if (email === database[user].email) {
      return database[user].id;
    }
  }

  return undefined;
};

function generateRandomString() {
  let codeList = ['a', 'b', 'c', 'd', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  let shortURL = '';

  for (let i = 0; i < 6; i++) {
    let randomNum = Math.round((Math.random() * 36));
    shortURL += codeList[randomNum];
  };

  return shortURL;
};

function urlsForUser(id, database) {
  let urlList = {};

  for (let smallURL in database) {
    if (database[smallURL].userID === id) {
      urlList[smallURL] = database[smallURL].longURL;
    }
  }
  return urlList;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser }