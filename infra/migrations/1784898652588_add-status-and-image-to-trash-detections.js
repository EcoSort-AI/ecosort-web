exports.up = (pgm) => {
  pgm.addColumns("trash_detections", {
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "processed",
    },
    image_path: {
      type: "text",
      notNull: false,
    },
  });
};

exports.down = false;
