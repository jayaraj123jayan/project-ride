var express = require('express');
var router = express.Router();
const db = require('../services/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { secret } = require('../services/auth');

/* GET users listing. */
router.post('/register', async function(req, res, next) {
  var user = req.body;
  var hashedPassword = await bcrypt.hash(user.password, 10);
  db.query('INSERT INTO users (email, password, username, name, bio) VALUES (?, ?, ?, ?, ?)', 
    [user.email, hashedPassword, user.username, user.name, user.bio], (err, result) => {
      if (err) {
        res.send("Error registering user: " + err);
        return;
      }
        
      user = {id: result.insertId, password: null, ...user};
      var token = getJwtToken(user);
      res.send({...user, token: token});
    });
  
});

router.post('/login', (req, res, next) => {
  var {email, password} = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) {
      res.status(401).send("Invalid email or password");
      return;
    }
    var user = results[0];
    var passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).send("Invalid email or password");
      return;
    }
    user.password = null;
    var token = getJwtToken(user);
    res.send({...user, token: token});
  });
});

getJwtToken = (user) => {
  return jwt.sign({...user}, secret, { expiresIn: '30m' });
}

module.exports = router;
