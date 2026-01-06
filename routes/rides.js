var express = require('express');
var router = express.Router();
const db = require('../services/db');
const { verifyToken} = require('../services/auth');

router.post('/create', verifyToken, (req, res, next) => {
  var ride = req.body;
  db.query('INSERT INTO ride (title, description, time, status, created_by, destination, start_from) VALUES (?, ?, ?, ?, ?, ?)', 
    [ride.title, ride.description, ride.time, ride.status, req.user.id, ride.destination, ride.start_from], (err, result) => {
      if (err) {
            res.send("Error creating ride: " + err);
            return;
      }
      riderId = result.insertId;
      const values = ride.memberUsernames;
      values.push(req.user.username); // add creator as member
      const inserQuery = `
        INSERT INTO ride_users (user_id, ride_id, status)
        SELECT u.id AS user_id, ? AS ride_id, 'invited' AS status
        FROM users u
        WHERE u.username IN (?)
      `;
      db.query(inserQuery,[riderId, values], (err, result) => {
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
  const rideId = req.params.id;

  // Fetch ride
  db.query('SELECT * FROM ride WHERE id = ?', [rideId], (err, rideResults) => {
    if (err || rideResults.length === 0) {
      return res.status(404).send("Ride not found");
    }

    const ride = rideResults[0];

    // Fetch members with their username + status
    const sql = `
      SELECT u.username, ru.status 
      FROM ride_users ru
      JOIN users u ON u.id = ru.user_id
      WHERE ru.ride_id = ?
    `;

    db.query(sql, [rideId], (err, members) => {
      if (err) {
        return res.send("Error fetching ride members: " + err);
      }

      ride.members = members.map(m => ({
        username: m.username,
        status: m.status
      }));

      res.send(ride);
    });
  });
});
router.post('/id/:id/start', verifyToken, (req, res, next) => {
  var rideId = req.params.id;
  db.query('UPDATE ride SET status=? WHERE id = ? and created_by = ?;', ['started', rideId, req.user.id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send("Ride starting failed");
      return;
    }
    res.send({message: "Ride started successfully"});
    return;
  });
});
router.post('/id/:id/join', verifyToken, (req, res, next) => {
  var rideId = req.params.id;
  db.query('UPDATE ride_users SET status=? WHERE ride_id = ? and user_id = ?;', ['joined', rideId, req.user.id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send("Ride Join failed");
      return;
    }
    res.send({message: "Joined ride successfully"});
    return;
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
  const userId = req.user.id;

  // Find rides where the user is part of ride_users
  const sql = `
    SELECT 
      r.*,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'username', u.username,
            'status', ru.status
          )
        )
        FROM ride_users ru 
        JOIN users u ON u.id = ru.user_id
        WHERE ru.ride_id = r.id
      ) AS members
    FROM ride r
    WHERE r.id IN (
      SELECT ride_id 
      FROM ride_users 
      WHERE user_id = ?
    )
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.log(err);
      return res.send("Error fetching rides: " + err);
    }

    res.send(results.map(ride => ({
      ...ride,
      members: !Array.isArray(ride.members)? JSON.parse(ride.members || '[]') : []
    })));
  });
});


module.exports = router;