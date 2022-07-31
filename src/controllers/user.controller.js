import userService from '../service/user.service';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../helpers/tokenHandler';
import { createResponse } from '../helpers/responseCreator';
import passport from 'passport';

const authenController = () => ({
   async login(req, res, next) {
      passport.authenticate('local', async (err, user, info) => {
         try {
            if (!err && user === 'null') {
               return res.status(200).json({
                  title: 'error',
                  message: 'Tên đăng nhập hoặc mật khẩu không đúng !',
               });
            }
            if (err || user === false) {
               const error = new Error('An error occurred.');
               return next(error);
            }
            req.login(user, { session: true }, async (error) => {
               if (error) return next(error);
               if (!!user) {
                  const accessToken = generateAccessToken(user);
                  const refreshToken = generateRefreshToken(user);
                  const insertRefreshTokenResult = await userService.insertRefreshTokens(refreshToken, user.userName);
                  if (insertRefreshTokenResult) {
                     res.status(200).json({
                        title: 'success',
                        message: 'Đăng nhập thành công !',
                        payload: { accessToken, refreshToken },
                     });
                  } else {
                     res.status(200).json({
                        title: 'error',
                        message: 'Insert refresh token failed',
                     });
                  }
               }
            });
         } catch (error) {
            return next(error);
         }
      })(req, res, next);
   },
   async register(req, res, next) {
      const userInfo = req.body;
      const result = await userService.register(userInfo);
      console.log('🚀 ~ file: authController.js ~ line 29 ~ result', result);
      if (result) res.status(200).json(createResponse('success', 'Đăng ký tài khoản thành công !'));
      else res.status(200).json(createResponse('error', 'Đăng ký tài khoản không thành công !'));
   },
   getLoginPage: (req, res) => {
      const user = req.user;
      const payloadInfo = req.payload;
      if (user) {
         res.redirect('/');
      } else {
         res.render('pages/login', { user: {}, isLoggedIn: false, ...payloadInfo });
      }
   },
   getRegisterPage: (req, res) => {
      const user = req.user;
      const payloadInfo = req.payload;
      if (user) {
         res.redirect('/');
      } else {
         res.render('pages/register', { user: {}, isLoggedIn: false, ...payloadInfo });
      }
   },
   async logout(req, res, next) {
      const { refreshToken } = req.body;
      req.logout(function (err) {
         if (err) {
            return res.json(createResponse('error', 'Logout thất bại !'));
         }
         if (!refreshToken) return res.json(createResponse('error', 'Missing refreshToken !'));
         verifyRefreshToken(refreshToken, async (err, user) => {
            if (err) return res.status(403).json(createResponse('error', 'Invalid refreshToken !'));
            const userName = user?.userName;
            if (!userName) return res.json({ info: 'missing userName !' });
            const deleteRefreshTokensResult = await userService.deleteRefreshTokensByUserName(userName);
            if (deleteRefreshTokensResult) res.json(createResponse('success', 'Login successfully !'));
            else res.json({ info: 'logout failed!' });
         });
      });
   },
   async getNewAccessToken(req, res, next) {
      const { refreshToken } = req.body;
      if (!refreshToken) res.status(401).json({ status: 401, message: 'Missing refresh token !' });
      const refreshTokens = await userService.getAllRefreshTokens();
      if (!refreshTokens?.includes(refreshToken)) {
         res.status(403).json({ status: 403, message: 'Forbidden' });
      } else {
         verifyRefreshToken(refreshToken, async (err, user) => {
            if (err) res.status(403).json({ status: 403, message: err.message });
            const newAccessToken = generateAccessToken({ userName: user?.userName });
            const newRefreshToken = generateRefreshToken({ userName: user?.userName });
            const insertRefreshTokenResult = await userService.insertRefreshTokens(refreshToken, user?.userName);
            insertRefreshTokenResult &&
               res.json(createResponse('success', 'Refresh token successfully !', { newAccessToken, newRefreshToken }));
            insertRefreshTokenResult || res.json(createResponse('error', 'Insert refresh token failed !'));
         });
      }
   },
});

export default authenController();