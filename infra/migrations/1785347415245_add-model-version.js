exports.up = (pgm) => {
  pgm.addColumn("trash_detections", {
    model_version: {
      type: "varchar(50)",
      notNull: true,
      default: "v1.0",
    },
  });
};

exports.down = false;