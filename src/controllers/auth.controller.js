import authService from '../service/auth.service';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../helpers/tokenHandler';
import { createResponse } from '../helpers/responseCreator';

const authenController = () => ({
   async login(req, res, next) {
      const { userName, password } = req.body;
      console.log({ userName, password });
      if (userName && password) {
         const acc = await authService.login(userName, password);
         if (acc) {
            const accessToken = generateAccessToken({ userName });
            const refreshToken = generateRefreshToken({ userName });
            const insertRefreshTokenResult = await authService.insertRefreshTokens(refreshToken, userName);
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
         } else res.status(200).json({ title: 'warning', message: 'Tên đăng nhập hoặc mật khẩu không đúng !' });
      } else res.status(200).json({ title: 'warning', message: 'Thiếu thông tin tài khoản !' });
   },
   async register(req, res, next) {
      const userInfo = req.body;
      const result = await authService.register(userInfo);
      console.log('🚀 ~ file: authController.js ~ line 29 ~ result', result);
      if (result) res.status(200).json(createResponse('success', 'Đăng ký tài khoản thành công !'));
      else res.status(200).json(createResponse('error', 'Đăng ký tài khoản không thành công !'));
   },
   async logout(req, res, next) {
      const { refreshToken } = req.body;
      if (!refreshToken) res.json({ info: 'missing refreshToken !' });
      verifyRefreshToken(refreshToken, async (err, user) => {
         if (err) res.status(403).json({ status: 403, message: err.message });
         const userName = user?.userName;
         if (!userName) res.json({ info: 'missing userName !' });
         const deleteRefreshTokensResult = await authService.deleteRefreshTokensByUserName(userName);
         if (deleteRefreshTokensResult) res.json({ info: 'logout successfully!' });
         else res.json({ info: 'logout failed!' });
      });
   },
   async getNewAccessToken(req, res, next) {
      const { refreshToken } = req.body;
      if (!refreshToken) res.status(401).json({ status: 401, message: 'Missing refresh token !' });
      const refreshTokens = await authService.getAllRefreshTokens();
      if (!refreshTokens?.includes(refreshToken)) {
         res.status(403).json({ status: 403, message: 'Forbidden' });
      } else {
         verifyRefreshToken(refreshToken, async (err, user) => {
            if (err) res.status(403).json({ status: 403, message: err.message });
            const newAccessToken = generateAccessToken({ userName: user?.userName });
            const newRefreshToken = generateRefreshToken({ userName: user?.userName });
            const insertRefreshTokenResult = await authService.insertRefreshTokens(refreshToken, user?.userName);
            insertRefreshTokenResult &&
               res.json(createResponse('success', 'Refresh token successfully !', { newAccessToken, newRefreshToken }));
            insertRefreshTokenResult || res.json(createResponse('error', 'Insert refresh token failed !'));
         });
      }
   },
});

export default authenController();
