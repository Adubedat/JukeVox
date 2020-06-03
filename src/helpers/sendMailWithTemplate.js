import nodemailer from 'nodemailer';
import ejs from 'ejs';

function setupTransporter() {
  let transporter;
  if (process.env.NODE_ENV === 'test') {
    transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });
  } else if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
  }
  return transporter;
}

export function sendEmailConfirmationLink(email, username, token) {
  return new Promise((resolve, reject) => {
    const transporter = setupTransporter();
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
            resolve();
          }
        });
      }
    });
  });
}

export function sendResetPasswordLink(email, token) {
  return new Promise((resolve, reject) => {
    const transporter = setupTransporter();
    const link = `https://jukevox.herokuapp.com/resetPassword/${token}`;
    ejs.renderFile(`${__dirname}/../../templates/resetPasswordMail.ejs`, { email, link }, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        const mainOptions = {
          to: email,
          subject: 'Jukevox - Reset Password',
          html: data,
        };
        transporter.sendMail(mainOptions, (error, info) => {
          if (error) {
            reject(error);
            console.log(error);
          } else {
            resolve();
          }
        });
      }
    });
  });
}
