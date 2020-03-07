import nodemailer from 'nodemailer';
import ejs from 'ejs';


export function sendEmailConfirmationLink(email, username, token) {
  return new Promise((resolve, reject) => {
    let transporter;
    if (process.env.NODE_ENV === 'production') {
      transporter = nodemailer.createTransport({
        host: process.env.MAILGUN_HOST,
        port: process.env.MAILGUN_PORT,
        auth: {
          user: process.env.MAILGUN_USER,
          pass: process.env.MAILGUN_PASS,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: 'smtp.mailtrap.io',
        port: 2525,
        auth: {
          user: process.env.MAILTRAP_USER,
          pass: process.env.MAILTRAP_PASS,
        },
      });
    }
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
        transporter.sendMail(mainOptions, (err, info) => {
          if (err) {
            reject(err);
            console.log(err);
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
