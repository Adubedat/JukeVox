const path = require('path');

export default async function getPrivacyPolicy(req, res) {
  res.status(200).sendFile(path.join(`${__dirname}/../../../../templates/privacyPolicy.html`));
}
