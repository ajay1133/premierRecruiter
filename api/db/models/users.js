module.exports = mongoose => {
  const users = mongoose.model(
    'users',
    new mongoose.Schema({
      email                 : { type: String },
      hash                  : { type: String },
      salt                  : { type: String },
      firstName             : { type: String },
      lastName              : { type: String },
      title                 : { type: String },
      address               : { type: String },
      state                 : { type: String },
      city                  : { type: String },
      zip                   : { type: String },
      phone                 : { type: String },
      description           : { type: String },
      image                 : { type: String },
      website               : { type: String },
      inviteToken           : { type: String },
      inviteStatus          : { type: Boolean, defaultValue: 0 },
      status                : { type: Number, defaultValue: 1 },
      role                  : { type: Number }
    },
    { 
      timestamps: true 
    })
  );
	return users;
};
