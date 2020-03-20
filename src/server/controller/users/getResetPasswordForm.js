import ejs from 'ejs';

export default async function getResetPasswordForm(req, res, next) {
  const { token } = req.params;

  const link = `https://jukevox.herokuapp.com/resetPassword/${token}`;

  try {
    ejs.renderFile(`${__dirname}/../../../../templates/resetPasswordForm.ejs`, { link }, (err, data) => {
      res.send(data);
    });
  } catch (err) {
    next(err);
  }
}
