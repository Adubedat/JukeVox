import {
  createUser, getUserAccountsTypes, searchForUser, confirmUserEmail, loginUser,
} from '../controller/userController';

export default function (app) {
  app.route('/users')
    .all((req, res, next) => {
      console.log("Hey ! I'm a happy Dadley");
      next();
    })
    .post(createUser);

  app.route('/users/:email/accounts')
    .all((req, res, next) => {
      console.log('/user/:email/accounts route called');
      next();
    })
    .get(getUserAccountsTypes);

  app.route('/users/search')
    .all((req, res, next) => {
      console.log('/user/search route called');
      console.log(`with query : ${req.query}`);
      next();
    })
    .get(searchForUser);

  app.route('/users/verify/:token')
    .all((req, res, next) => {
      console.log('user/verify route called');
      console.log(`with param : ${req.params}`);
      next();
    })
    .get(confirmUserEmail);

  app.route('/users/login')
    .all((req, res, next) => {
      console.log('/users/login route called');
      console.log(`with params :${req.params}`);
      next();
    })
    .post(loginUser);
}
