exports.up = (pgm) => {
  pgm.addColumns("trash_detections", {
    source_event_id: {
      type: "uuid",
      unique: true,
      default: null,
    },
  });
};

exports.down = false;
