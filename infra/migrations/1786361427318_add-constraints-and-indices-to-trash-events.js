exports.up = (pgm) => {
  pgm.sql(`
    UPDATE trash_detections SET item_class = 'white-glass' WHERE item_class = 'white glass';
    UPDATE trash_detections SET item_class = 'brown-glass' WHERE item_class = 'brown glass';
    UPDATE trash_detections SET item_class = 'green-glass' WHERE item_class = 'green glass';
    
    UPDATE trash_detections SET ai_prediction = 'white-glass' WHERE ai_prediction = 'white glass';
    UPDATE trash_detections SET ai_prediction = 'brown-glass' WHERE ai_prediction = 'brown glass';
    UPDATE trash_detections SET ai_prediction = 'green-glass' WHERE ai_prediction = 'green glass';

    UPDATE trash_detections SET confidence = 1 WHERE confidence > 1;
    UPDATE trash_detections SET confidence = 0 WHERE confidence < 0;
  `);

  pgm.dropConstraint("trash_detections", "check_confidence_range", {
    ifExists: true,
  });
  pgm.addConstraint("trash_detections", "check_confidence_range", {
    check: "confidence >= 0 AND confidence <= 1",
  });

  const validClasses = [
    "'plastic'",
    "'metal'",
    "'white-glass'",
    "'brown-glass'",
    "'green-glass'",
    "'paper'",
    "'cardboard'",
    "'biological'",
    "'trash'",
    "'invalid_image'",
  ].join(", ");

  pgm.dropConstraint("trash_detections", "check_valid_item_class", {
    ifExists: true,
  });
  pgm.addConstraint("trash_detections", "check_valid_item_class", {
    check: `item_class IN (${validClasses})`,
  });

  pgm.dropConstraint("trash_detections", "check_valid_ai_prediction", {
    ifExists: true,
  });
  pgm.addConstraint("trash_detections", "check_valid_ai_prediction", {
    check: `ai_prediction IN (${validClasses})`,
  });

  pgm.createIndex("trash_detections", "detected_at", { ifNotExists: true });
  pgm.createIndex("trash_detections", "bin_id", { ifNotExists: true });
  pgm.createIndex("trash_detections", "item_class", { ifNotExists: true });
  pgm.createIndex("trash_detections", "review_status", { ifNotExists: true });
  pgm.createIndex("trash_detections", "reviewed_by", { ifNotExists: true });
  pgm.createIndex("trash_detections", "model_version", { ifNotExists: true });

  pgm.createIndex("trash_detections", "review_status", {
    name: "idx_trash_detections_pending_with_image",
    where: "review_status = 'pending' AND image_path IS NOT NULL",
    ifNotExists: true,
  });
};

exports.down = false;
