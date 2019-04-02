const db = require('../db');
const accountService = require('../../services/accountService');
module.exports = async () => {
  try {
    const adminUser = {
      email: 'admin@premierRecruiter.com',
      password: 'admin123',
      role: 1,
      firstName: 'Super',
      lastName: 'Admin',
      status: 1
    };
    // Entry in users table 
    await accountService.createUser(adminUser); 
    // Entry in seeders table
    await db.models.seeders.create({
      seeder: 'create-users-adminUser'
    });
    console.log('Successfully created seeder adminUser');
  } catch (err) {
    console.log('Error creating seeder adminUser: ', err);
  }
}; 