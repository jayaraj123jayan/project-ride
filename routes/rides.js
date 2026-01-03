var express = require('express');
var router = express.Router();
const db = require('../services/db');
const { verifyToken} = require('../services/auth');

router.post('/create', verifyToken, (req, res, next) => {
  var ride = req.body;
  db.query('INSERT INTO ride (title, description, time, created_by, destination, start_from) VALUES (?, ?, ?, ?, ?, ?)', 
    [ride.title, ride.description, ride.time, req.user.id, ride.destination, ride.start_from], (err, result) => {
      if (err) {
            res.send("Error creating ride: " + err);
            return;
      }
      riderId = result.insertId;
      const values = ride.members.map(userId => [userId, riderId]);
      values.push([req.user.id, riderId]); // add creator as member
      db.query('INSERT INTO ride_users (user_id, ride_id) VALUES ?',[values], (err, result) => {
        if (err) {
            db.query('DELETE FROM ride WHERE id = ?', [riderId]); // rollback ride creation
            res.send("Error adding members to ride: " + err);
            return;
        }
        ride = {id: riderId, ...ride};
        res.send(ride);
      });

    });
});

router.get('/id/:id', verifyToken, (req, res, next) => {
  var rideId = req.params.id;
  db.query('SELECT * FROM ride WHERE id = ?', [rideId], (err, results) => {
    if (err || results.length === 0) {
      res.status(404).send("Ride not found");
      return;
    }
    var ride = results[0];
    db.query('SELECT user_id FROM ride_users WHERE ride_id = ?', [rideId], (err, results) => {
      if (err) {
        res.send("Error fetching ride members: " + err);
        return;
      }
      db.query('SELECT username FROM users WHERE id IN (?)', [results.map(r => r.user_id)], (err, userResults) => {
        if (err) {
          res.send("Error fetching ride members: " + err);
          return;
        }
        ride.members = userResults.map(u => u.username);
        res.send(ride);
      });
    });
  });
});
router.get('/', verifyToken, (req, res, next) => {
  db.query('SELECT * FROM ride where created_by = ?', [req.user.id], (err, results) => {
    if (err) {
        res.send("Error fetching rides: " + err);
        return;
    }
    res.send(results);
  });
});

router.get('/my-rides', verifyToken, (req, res, next) => {
  db.query('SELECT ride_id FROM ride_users WHERE user_id = ?', [req.user.id], (err, results) => {
    if (err) {
        res.send("Error fetching rides: " + err);
        return;
    }
    // res.send(results);
    const rideIds = results.map(row => row.ride_id);
    if (rideIds.length === 0) {
      res.send([]);
      return;
    }
    db.query('SELECT r.*, (SELECT JSON_ARRAYAGG(ru.user_id) FROM ride_users ru WHERE ru.ride_id = r.id) AS members FROM ride r WHERE r.id IN (?);', [rideIds], (err, results) => {
      if (err) {
        console.log(err);
          res.send("Error fetching rides: " + err);
          return;
      }
      res.send(results);
    });
  });
});

module.exports = router;