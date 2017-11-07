exports.loginForm = function(req, res) {
  var demoUser;
  if (process.env.NODE_ENV !== 'prod' &&
      process.env.NODE_ENV !== 'production') {
    demoUser = {
      username: 'lakisov+001@singree.com',
      password: 'test'
    };
  }
  res.render('login', {demoUser: demoUser});
};

exports.callbackPage = function(req, res) {
  res.render('callback');
};
