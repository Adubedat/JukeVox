import nodemailer from 'nodemailer';
import ejs from 'ejs';


export function sendEmailConfirmationLink(email, username, token) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });
    const link = `https://jukevox.herokuapp.com/confirmEmail/${token}`;
    ejs.renderFile(`${__dirname}/../../templates/emailConfirmation.ejs`, { username, link }, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        const mainOptions = {
          to: email,
          subject: 'Jukevox - Email confirmation',
          html: data,
        };
        transporter.sendMail(mainOptions, (error, info) => {
          if (error) {
            reject(error);
            console.log(error);
          } else {
            console.log(`Message sent: ${info.response}`);
            resolve();
          }
        });
      }
    });
  });
}

export function sendResetPasswordLink(email, token) {
  console.log('TODO');
}
