const db = require('../db');
const constants = require('../constants');

exports.strictValidObject = obj => obj && obj === Object(obj) &&
	Object.prototype.toString.call(obj) !== '[object Array]';

exports.strictValidObjectWithKeys = obj => exports.strictValidObject(obj) && !!Object.keys(obj).length;

exports.strictValidArrayWithLength = arr => arr && Array.isArray(arr) && !!arr.length;

exports.isValidTable = table => {
	let isValidTable = false;
	isValidTable = table && Object.keys(db.models).indexOf(table) > -1;
	return isValidTable;
};

exports.insertTableData = (table, dataObject) => exports.isValidTable(table) &&
	exports.strictValidObjectWithKeys(dataObject) && db.models[table].create(dataObject);

exports.bulkInsertTableData = (table, dataListOfObjects) => exports.isValidTable(table) &&
	exports.strictValidArrayWithLength(dataListOfObjects) && db.models[table].bulkCreate(dataListOfObjects);

exports.updateTableData = (table, dataObject, where) => exports.isValidTable(table) &&
	exports.strictValidObjectWithKeys(dataObject) && exports.strictValidObject(where) &&
	db.models[table].update(where, dataObject);

exports.deleteTableData = (table, where) => exports.isValidTable(table) &&
	exports.strictValidObjectWithKeys(where) && db.models[table].destroy(where);

exports.bulkDeleteTableData = (table, where) => exports.isValidTable(table) &&
	exports.strictValidObjectWithKeys(where) && db.models[table].bulkDelete(where);