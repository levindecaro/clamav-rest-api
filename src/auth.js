const auth = require('basic-auth');
const appUser = process.env.APP_USER || 'cra';
const appUserPassword = process.env.APP_USER_PASSWORD || 'cra';

const requestUser = { name: appUser, password: appUserPassword }

module.exports = function (request, response, next) {
  var user = auth(request)
  if (!user || !requestUser.name || requestUser.password !== user.pass) {
    response.set('WWW-Authenticate', 'Basic realm="Login"')
    return response.status(401).send()
  }
  return next()
}
