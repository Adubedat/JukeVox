import { createUser, registerUser, getUserAccountsTypes } from '../controller/userController';

export default function (app) {
  app.route('/user')
    .all((req, res, next) => {
      console.log("Hey ! I'm a happy Dadley");
      next();
    })
    .post(createUser);

  app.route('/user/:email/accounts')
    .all((req, res, next) => {
      console.log('/user/:email/accounts route called');
      next();
    })
    .get(getUserAccountsTypes);


//   app.route('/user/register')
//     .all((req, res, next) => {
//       console.log('New user registration request');
//       next();
//     })
//     .post(registerUser);
}
