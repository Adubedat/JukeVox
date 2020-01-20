import { createUser, getUserAccountsTypes, searchForUser } from '../controller/userController';

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

//   app.route('/user/register')
//     .all((req, res, next) => {
//       console.log('New user registration request');
//       next();
//     })
//     .post(registerUser);
}
