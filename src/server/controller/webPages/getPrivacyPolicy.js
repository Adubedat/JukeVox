const path = require('path');

export default async function getPrivacyPolicy(req, res, next) {
  console.log(path.join(`${__dirname}templates/privacyPolicy.html`));
  res.sendFile(path.join(`${__dirname}/../../../../templates/privacyPolicy.html`));
}
