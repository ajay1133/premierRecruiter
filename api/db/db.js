const mongoose = require('mongoose');
const config = require('config');
const settings = config.db;
const path = require('path');
const fs = require('fs');

const db = mongoose.connect(settings.host, { 
  useNewUrlParser: true,
  reconnectTries: 100,
  reconnectInterval: 500,
  autoReconnect: true,
  useNewUrlParser: true, 
  dbName: settings.database 
});
  
db.models = {};
const modelsDirRelativePath = './models';
const dbModelsDirAbsPath = path.resolve(__dirname, modelsDirRelativePath);

// Read models directory in db folder and assign to db.models object
fs.readdirSync(dbModelsDirAbsPath).forEach(file => {
	const fileName = path.parse(file).name;
	const fileExt = path.parse(file).ext;
	if (fileName && fileExt.toLowerCase() === '.js') {
    const modelToAssign = new require(`${modelsDirRelativePath}/${fileName}`);
    if (typeof modelToAssign === 'function') {
      db.models[fileName] = modelToAssign(mongoose);
    }
	}
}); 
  
// Export
module.exports = db;
