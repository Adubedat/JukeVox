export default async function confirmLoaderio(req, res, next) {
  try {
    res.sendFile('/loaderio-93f4e56e9270cfa4d6e5d226b66a9405.txt', { root: '.' });
  } catch (err) {
    console.log(err);
    next(err);
  }
}
