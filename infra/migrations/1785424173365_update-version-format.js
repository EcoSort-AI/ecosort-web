exports.up = (pgm) => {
  pgm.sql(`
    UPDATE trash_detections 
    SET model_version = 'v1.0.0' 
    WHERE model_version = 'v1.0';
  `);

  pgm.alterColumn("trash_detections", "model_version", {
    default: "v1.0.0",
  });
};

exports.down = false;
