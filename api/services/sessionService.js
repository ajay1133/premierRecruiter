const assert = require('assert');
const i18n = require('../helpers/i18nHelper');
const Boom = require('boom');
const db = require('../db');
const cryptoHelper = require('../helpers/cryptoHelper');
const jwtHelper = require('../helpers/jwtHelper');
const constants = require('../constants');
const { forgotPassword } = require('../mailer');
const { users } = db.models;

/**
 * Find session user on basis of sessionData from JWT
 * @param sessionData { id }
 */
exports.findSessionUser = async sessionData => {
  const userDetails = await users.findOne({        
    _id: sessionData._id
  });
  return userDetails;
};


/**
 * Authenticate a user by its email and plain password
 * @param email
 * @param password
 */
exports.authenticate = async (email, password) => {
  assert(email, i18n('services.sessionService.missingEmail'));
  assert(password, i18n('services.sessionService.missingPassword'));
  let userDetails = await users
    .findOne({ email })
    .select(constants.USER_AUTHENTICATION_ATTRIBUTES);
  let user;
  if (userDetails) {
    user = userDetails.toJSON();
    if (user.salt) {
      let hashData = await cryptoHelper.hashStringWithSalt(password, user.salt);
      if (user.hash !== hashData.hash) {
        return Boom.badRequest(i18n('services.sessionService.wrongUsernamePassword'));
      }
    } else {
      return Boom.badRequest(i18n('services.sessionService.wrongUsernamePassword'));
    }
    // Sanitize user and return
    delete user.hash;
    delete user.salt;
  }
  return user;
};

/**
 * forgotPassword: Authenticate a user by its email and send reset link
 * @param email
 */
exports.forgotPassword = async email => {
  assert(email, i18n('services.sessionService.missingEmail'));
  let toUpdateData = {};
  let userDetails = await users
    .findOne({ email })
    .select(constants.USER_AUTHENTICATION_ATTRIBUTES);
  if (userDetails) {
    const user = userDetails.toJSON();  
    toUpdateData.inviteToken = await jwtHelper.sign(user, '48h', 'HS512');
    toUpdateData.inviteStatus = 0;
    // Update in database
    const updatedData = await users.findOneAndUpdate(
      { _id: user._id }, 
      toUpdateData, 
      { upsert: true }
    );
    console.log(updatedData);
    // Send forgot password email
    user.token = toUpdateData.inviteToken;
    await forgotPassword(user);
    return true;
  } else {
    return false;
  }
};
