module.exports = mongoose => {
  const seeders = mongoose.model(
    'seeders',
    new mongoose.Schema({
      seeder                : { type: String }
    },
    { 
      timestamps: true 
    })
  );
	return seeders;
};
