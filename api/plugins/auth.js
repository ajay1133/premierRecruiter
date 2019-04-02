const assert = require('assert');
const Boom = require('boom');
const i18n = require('../helpers/i18nHelper');
const jwtHelper = require('../helpers/jwtHelper');
const sessionService = require('../services/sessionService');

const internals = {};

exports.plugin = {
  name: 'simAuth',
  register: (server, options) => {
    server.auth.scheme('simAuth', internals.implementation);
    server.expose('jwtToken', internals.jwtToken);
    server.auth.strategy('default', 'simAuth', {
      secret: options.secret,
      isSecure: options.isSecure,
    });
  }
};

internals.implementation = (server, options) => {
  assert(options, 'options not defined');
  assert(options.secret, 'options.secret is missing');
  const settings = Object({ sessionKey: 'sid' }, options);
  settings.sessionKey = 'AUTH_USER';
  internals.settings = settings;
  server.ext('onPreAuth', (request, h) => {
    request.auth.session = {
      user: null,
      set: (user) => {
        request.yar.set(settings.sessionKey, internals.authCredentials(user));
        return user;
      },
      clear: () => {
        request.yar.clear(settings.sessionKey);
      },
    };
    return h.continue;
  });
  return { authenticate: internals.authenticate };
};

internals.authCredentials = user => ({ id: user._id });

//Authenticate
internals.authenticate = async (request, h) => {
  const unauthorized = err => {
    return Boom.unauthorized(err);
  };
  const authorize = async authData => {
    if (!authData || typeof authData !== 'object') {
      return Boom.badImplementation('No auth data');
    }
    try {
      let user = await sessionService.findSessionUser(authData);
      if (!user) {
        return unauthorized(i18n('plugins.auth.invalid')); // invalid session data
      }
      let userCredentials = authData;
      return h.authenticated({ credentials: userCredentials });
    }
    catch(err) {
      return Boom.internal();
    }
  };
  const authHeader = request.raw.req.headers.authorization;
  if (authHeader) { 
    // JWT token based session
     let userdata = await internals.jwtScheme(authHeader);
     if (userdata) {
      return await authorize(userdata);
     } else {
      return unauthorized(userdata);
     }
  }
  else {  
    // Cookie based session
    const authData = request.yar.get(internals.settings.sessionKey);
    if (authData) {
      return await authorize(authData);
    } else {
      return unauthorized(i18n('plugins.auth.expired'));
    }
  }
};

//JWT Scheme
internals.jwtScheme = async jwtToken => {
  if (!jwtToken) {
    return Boom.badImplementation(i18n('plugins.auth.missingToken'));
  }
  const parts = jwtToken.split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || parts[1].split('.').length !== 3) {
    return Boom.badImplementation(i18n('plugins.auth.invalidToken'));
  }
  const token = parts[1];
  try {
    let userdata = await jwtHelper.verify(token);
    return userdata;
  } catch(err) {
    if (err && err.message === 'jwt expired') {
      return Boom.badImplementation(i18n('plugins.auth.expired'));
    }
    return Boom.badImplementation(err);
  }
}
