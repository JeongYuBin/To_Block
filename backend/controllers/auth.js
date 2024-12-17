const jwt = require('jsonwebtoken');

function generateToken(user) {
    //return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
	return jwt.sign(user, 'hello', { expiresIn: '1h' });
}

module.exports = {
	generateToken
};