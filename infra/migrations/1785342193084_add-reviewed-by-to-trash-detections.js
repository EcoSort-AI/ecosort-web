exports.up = (pgm) => {
  pgm.addColumn("trash_detections", {
    reviewed_by: {
      type: "uuid",
      notNull: false,
      references: '"users"(id)',
      onDelete: "SET NULL",
    },
  });
};

exports.down = false;
