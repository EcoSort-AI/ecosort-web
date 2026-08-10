exports.up = (pgm) => {
  pgm.addColumns("trash_detections", {
    updated_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    reviewed_at: {
      type: "timestamp with time zone",
      default: null,
    },
    stored_at: {
      type: "timestamp with time zone",
      default: null,
    },
  });

  pgm.sql(`
    UPDATE trash_detections 
    SET 
      reviewed_at = detected_at,
      stored_at = detected_at
    WHERE review_status = 'approved' AND reviewed_at IS NULL;
  `);
};

exports.down = false;
