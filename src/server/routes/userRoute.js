import { createUser, registerUser } from '../controller/userController';

export default function (app) {
  app.route('/user')
    .all((req, res, next) => {
      console.log("Hey ! I'm a happy Dadley");
      next();
    })
    .post(createUser);

  app.route('/user/register')
    .all((req, res, next) => {
      console.log('New user registration request');
      next();
    })
    .post(registerUser);
}
