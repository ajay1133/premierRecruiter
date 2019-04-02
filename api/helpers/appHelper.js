const path = require('path');
const fs = require('fs');
const db = require('../db');
const logger = require('./logHelper');
exports.checkDbConnection = async () => {
  try {
    await db;
    logger.info('Connection has been established successfully');
    const executedSeeders = await db.models.seeders.find();
    const seedersList = [];
    const seedersDirRelativePath = '../db/seeders';
    const dbSeedersDirAbsPath = path.resolve(__dirname, seedersDirRelativePath);
    // Read seeders directory in db folder and execute them
    fs.readdirSync(dbSeedersDirAbsPath).forEach(file => {
      const fileName = path.parse(file).name;
      const fileExt = path.parse(file).ext;
      // If a valid .js file && entry does not exist in 'seeders' table add the file to seeders
      if (fileName && fileExt.toLowerCase() === '.js') { 
        const seederToInsert = require(`${seedersDirRelativePath}/${fileName}`);
        let isSeederExecuted = false;
        executedSeeders.forEach(document => {
          if (document.seeder === fileName) {
            isSeederExecuted = true;
          } 
        });
        if (!isSeederExecuted && typeof seederToInsert === 'function') {
          seedersList.push(seederToInsert);  
        }           
      }
    });
    // Read seeders & execute them
    await Promise.all(seedersList.map(seeder => seeder()));      
  } catch (err) {
    logger.info(err);
  }
};
