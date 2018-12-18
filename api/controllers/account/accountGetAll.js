const joi = require('joi');
const boom = require('boom');
const accountService = require('../../services/accountService');

module.exports = {
  plugins: {
    'hapi-swagger': {
      payloadType: 'form',
    },
  },
//  auth: {
//    strategy: 'default'
//  },
  tags: ['api', 'account'],
  description: 'Get all accounts',
  notes: 'Get all accounts',
  validate: {
    query: {
      status: joi.number()
                 .allow(['', null])
                 .description('1=Active, 2=Pending, 3=Denied'),
      
      keyword: joi.string()
                 .allow(['', null])
                 .description('Search keyword: Title, Description'),
  
      Page: joi.number()
               .default(1)
               .description('page number to get list of Account'),
  
      Limit: joi.number()
                .default(10)
                .description('number of account per page'),
    },
    options: { abortEarly: false },
  },
  handler: async (request, h) => {
    const { query } = request;
    
    try {
      let data = await accountService.getAllAccounts(query);
      return h.response(data);
    } catch(err) {
      return boom.badRequest(err);
    }
  }

};
