exports.up = (pgm) => {
  pgm.createTable("device_telemetry", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    device_name: {
      type: "varchar(64)",
      notNull: true,
    },
    cpu_usage: {
      type: "numeric(5,2)", // Ex: 42.50
      notNull: true,
    },
    temperature: {
      type: "numeric(5,2)", // Ex: 58.00
      notNull: true,
    },
    ram_usage: {
      type: "varchar(32)", // Ex: "1.2 / 4 GB"
      notNull: true,
    },
    disk_free: {
      type: "varchar(32)", // Ex: "14.5 GB"
      notNull: true,
    },
    uptime: {
      type: "varchar(64)", // Ex: "Up 3 days"
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  pgm.createIndex("device_telemetry", ["device_name", "created_at"]);
};

exports.down = false;
