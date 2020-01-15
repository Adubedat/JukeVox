
exports.createUser = function createUser(user) {
  return new Promise(((resolve, reject) => {
    setTimeout(() => {
      resolve('New user created, took me only 1 sec');
    }, 1000);
  }));
};
