exports.up = (pgm) => {
  pgm.addColumns("device_settings", {
    token_hash: {
      type: "varchar(64)",
      unique: true,
    },
  });
};

exports.down = false;
