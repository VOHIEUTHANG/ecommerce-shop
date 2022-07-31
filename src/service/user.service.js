import pool from '../database/pool';

import PasswordHandler from '../helpers/passwordHandler';

class AuthenService {
   async login(username, password) {
      const [rows] = await pool.execute(
         'SELECT userName,password,avatar,permissionCode FROM account,role WHERE userName = ? AND ROLE_ID = role.id;',
         [username],
      );
      if (rows.length > 0) {
         const checkMatchPassword = PasswordHandler.checkMatch(password, rows[0].password);
         const user = rows[0];
         delete user.password;
         return checkMatchPassword ? user : null;
      }
      return null;
   }
   async register({ fullName, email, phoneNumber, userName, password }) {
      const hashPassword = PasswordHandler.getHashPassword(password);
      try {
         const [insertAccountHeaderResult] = await pool.query(
            'INSERT INTO account (userName,password,ROLE_ID,isVerify,isLocked) VALUES (?,?,3,0,0)',
            [userName, hashPassword],
         );
         const [insertUserHeaderResult] = await pool.query(
            'INSERT INTO user (userName,fullName,email,phoneNumber) VALUES (?,?,?,?)',
            [userName, fullName, email, phoneNumber],
         );
         return insertAccountHeaderResult.affectedRows > 0 && insertUserHeaderResult.affectedRows > 0 ? true : false;
      } catch (error) {
         return false;
      }
   }
   async getAllRefreshTokens() {
      const [rows] = await pool.execute('select refreshToken from refresh_tokens');
      if (rows.length > 0) {
         const refreshTokens = rows.map((tokenObject) => tokenObject.refreshToken);
         return refreshTokens;
      }
      return null;
   }
   async insertRefreshTokens(refreshToken, userName) {
      try {
         const [{ affectedRows }, rows] = await pool.execute(
            'INSERT INTO refresh_tokens (refreshToken,userName) VALUES (?,?);',
            [refreshToken, userName],
         );
         return affectedRows > 0;
      } catch (error) {
         console.log('Insert data into refresh_tokens table occured error :', error);
         return false;
      }
   }
   async deleteRefreshTokensByUserName(userName) {
      try {
         const [{ affectedRows }, rows] = await pool.execute('DELETE FROM refresh_tokens WHERE userName = ?;', [
            userName,
         ]);
         return affectedRows > 0;
      } catch (error) {
         console.log('Delete refresh token occured error :', error);
         return false;
      }
   }
}
export default new AuthenService();