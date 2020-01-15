
import createUser from '../controller/userController';

export default function (app) {
  app.route('/user')
    .all((req, res, next) => {
      console.log("Hey ! I'm a happy Dadley");
      next();
    })
    .post(createUser);
}
