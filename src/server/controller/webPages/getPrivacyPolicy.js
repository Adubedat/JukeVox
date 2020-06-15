const path = require('path');

export default async function getPrivacyPolicy(req, res) {
  res.sendFile(path.join(`${__dirname}/../../../../templates/privacyPolicy.html`));
}
