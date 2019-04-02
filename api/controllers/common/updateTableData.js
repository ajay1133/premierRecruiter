const joi = require('joi');
const boom = require('boom');
const commonService = require('../../services/commonService');
module.exports = {
  plugins: {
    'hapi-swagger': {
      payloadType: 'form',
    },
  },
  auth: {
    strategy: 'default'
  },
  tags: ['api', 'common'],
  description: 'Update table data',
  notes: 'Update table data',
  validate: {
    payload: {
	    table: joi.string()
	              .required()
	              .description('Table to update data'),
      dataObj: joi.object()
                  .required()
                  .description('Update data object in table'),
	    whereObj: joi.object()
	                .required()
	                .description('Where condition object')
    },
    options: { abortEarly: false },
  },
  handler: async (request, h) => {
    const { payload } = request;
	  const { table, updateDataObj, whereObj } = payload;
    try {
      let data = await commonService.updateTableData(table, updateDataObj, whereObj);
      return h.response(data);
    } catch(err) {
      return boom.badRequest(err);
    }
  }
};
