/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable("trash_detections", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    bin_id: {
      type: "varchar(50)",
      notNull: true,
    },
    item_class: {
      type: "varchar(30)",
      notNull: true,
    },
    confidence: {
      type: "real",
      notNull: true,
    },
    detected_at: {
      type: "timestamp with time zone",
      notNull: true,
    },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = false;
