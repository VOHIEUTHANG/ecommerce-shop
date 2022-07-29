const mainController = () => ({
   getHomePage: (req, res) => {
      res.render('pages/home', { isLoggedIn: true });
   },
   getLoginPage: (req, res) => {
      res.render('pages/login');
   },
   getRegisterPage: (req, res) => {
      res.render('pages/register');
   },
   get404Page: (req, res) => {
      res.render('pages/404');
   },
});

export default mainController();
