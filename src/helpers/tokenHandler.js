import jwt from 'jsonwebtoken';

const generateAccessToken = (data, exitsTime = '1h') =>
   jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, { expiresIn: exitsTime });

const generateRefreshToken = (data, exitsTime = '1d') =>
   jwt.sign(data, process.env.REFRESH_TOKEN_SECRET, { expiresIn: exitsTime });

const verifyRefreshToken = (refreshToken, callbackHanlder) => {
   console.log('verify');
   jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, callbackHanlder);
};

export { generateAccessToken, generateRefreshToken, verifyRefreshToken };
