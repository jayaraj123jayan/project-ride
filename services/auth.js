const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'secert-key2834023984sfsdfdfr432423';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};
const verifyTokenIO = (token) => {
  if (!token) throw new Error('Access denied');

  const user = jwt.verify(token, secret);
  return user;
}
module.exports = { verifyToken, verifyTokenIO, secret };