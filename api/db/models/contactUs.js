module.exports = mongoose => {
  const contactUs = mongoose.model(
    'contactUs',
    new mongoose.Schema({
      name                  : { type: String },
      email                 : { type: String },
      message               : { type: String },
      status                : { type: Number, defaultValue: 1 }
    },
    {
      timestamps: true
    })
  );
	return contactUs;
};
