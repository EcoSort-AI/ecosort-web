exports.up = (pgm) => {
  pgm.createTable("device_settings", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    device_name: {
      type: "varchar(64)",
      notNull: true,
      unique: true,
    },
    confidence_threshold: {
      type: "integer",
      notNull: true,
      default: 80,
    },
    classes_status: {
      type: "jsonb",
      notNull: true,
      default: pgm.func(
        `'{"plastico": true, "papel": true, "metal": true, "vidro": true, "organico": true}'::jsonb`,
      ),
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  pgm.createTable("device_commands", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    device_setting_id: {
      type: "uuid",
      notNull: true,
      references: "device_settings",
    },
    command: {
      type: "varchar(128)",
      notNull: true,
    },
    status: {
      type: "varchar(32)",
      notNull: true,
      default: "pending",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    executed_at: {
      type: "timestamptz",
    },
  });
};

exports.down = false;
