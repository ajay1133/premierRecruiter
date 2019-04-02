const assert = require('assert');
const config = require('config');
const i18n = require('../helpers/i18nHelper');
const db = require('../db');
const cryptoHelper = require('../helpers/cryptoHelper');
const logger = require('../helpers/logHelper');
const Boom = require('boom');
const { users } = db.models;
const jwtHelper = require('../helpers/jwtHelper');
const { userRegistration, contactUs } = require('../mailer');
const constants = require('../constants');

/**
 * Create a user
 * @param userPayload {email, password}
 */
exports.createUser = async userPayload => {
  try {
	  assert(userPayload, i18n('services.accountService.missingUserPayload'));
    const userData = Object.assign({}, userPayload);
    // Delete password from userData object
    delete userData.password;
    // Search for existing user with same email
    const existingUser = await users.findOne({ email: userPayload.email });
    // Exit with error code if same user is found
    if (existingUser) {
      return i18n('services.accountService.emailExists');
    }
    // If password is passed get hash & salt else set inviteToken by encoding userData
    if (userPayload.password) {
      const encryptedHash = await cryptoHelper.hashString(userPayload.password);
      userData.hash = encryptedHash.hash || '';
			userData.salt = encryptedHash.salt || '';
    } else {
      userData.inviteToken = await jwtHelper.sign(userData, '48h', 'HS512');;
			userData.inviteStatus = 0;
    }
	  const createdUser = await users.create(userData);
	  // Send user registration email if the flag is set to true
		if (userPayload.sendInvitationEmailFlag) {
      const url = config.BasePath.host;
      const subject = ' Welcome to Premier Recruiter';
			const model = {
				inviteLink: userData.inviteToken ? `${url}/accept/invitation/${userData.inviteToken}` : `${url}`,
		    name: userPayload.firstName + ' ' + userPayload.lastName,
				inviteToken: userData.inviteToken
      };
      await userRegistration(userPayload.email, subject, model);
    }
    return createdUser.toJSON();	
  } catch(err) {
    return err;
  }
};

/**
 * Return all user accounts for management
 */
exports.getAllAccounts = async query => {
  let { page, limit, order } = query;
  let conditionArr = [];
  let finalInclude = [];
  page = page && page > 1 ? page : 1;
  let offset = page - 1;
  limit = (limit && parseInt(limit)) || 0;
  offset *= limit;
  if (!order) {
    order = JSON.stringify([['_id', 'ASC']]);
  }
	/*return await users.findAndCountAll({
	  attributes: constants.DEFAULT_USER_ATTRIBUTES,
    include: finalInclude,
    where: {        
      role: { $in: constants.DEFAULT_USER_ROLES },
      $and: conditionArr
    },
    offset,
    limit,
    order: JSON.parse(order)
  });*/
};

/**
 * Get User on basis of user id
 * @param userId
 */
exports.getUser = async userId => {
  if (userId) {
    try {
      let userDetails = await users
        .findOne({ _id: userId })
        .select(constants.DEFAULT_USER_ATTRIBUTES);
      if (userDetails) {
        return userDetails.toJSON();
      } else {
        return Boom.internal('User Not Found');
      }
    } catch(err) {
      return err;
    }
  } else {
    return Boom.internal('User Not Found');
  }
};

/**
 * Get User on basis of user email
 * @param email
 */
exports.getUserByEmail = async email => {
	try {
		let userDetails = await users.findOne({
			email
		});
		if (userDetails) {
			return userDetails.toJSON();
		} else {
			return Boom.internal('User Not Found');
		}
	} catch(err) {
		return err;
	}
};

/**
 * Update User
 * @param userPayload { email, password, firstName, lastName } etc
 */
 exports.updateUser = async (id, userPayload) => {
   // assert(userPayload, i18n('services.accountService.missingUserPayload'));
   const userData = Object.assign({}, userPayload);
   if (userPayload.password) {
     delete userData.password;
     delete userData.id;
     const encryptedHash = await cryptoHelper.hashString(userPayload.password);
     userData.pwd = encryptedHash.hash || '';
     userData.pwdSalt = encryptedHash.salt || '';
   }
   const updatedUser = await users.update(userData, { where: { id } });
   return updatedUser;
 };

 /**
  * Update user password on confirmation
  * @param userPayload { password, email }
  */
 exports.updatePassword = async userPayload => {
  try {
    const userData = Object.assign({}, userPayload);
    delete userData.password;
    let encryptedHash = await cryptoHelper.hashString(userPayload.password);
    userData.hash = encryptedHash.hash || '';
    userData.salt = encryptedHash.salt || '';
    return await users.update(userData, { where:{ email: userPayload.email }});
  } catch(err) {
    return err;
  }
 };

/**
 * contactUs: Used to send contact us email
 * @param payload
 */
exports.contactUs = async payload =>  {
  try {
    const { name, email, message } = payload;
    // Contact Us Email
    const subject = ' Contact US Email';
    const model = { name, message };
    return contactUs(email, subject, model);
  } catch(err) {
    return err;
  }
};