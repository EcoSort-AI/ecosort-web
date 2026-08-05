exports.up = (pgm) => {
  pgm.addConstraint("trash_detections", "check_confidence_range", {
    check: "confidence >= 0 AND confidence <= 1",
  });

  pgm.addConstraint("trash_detections", "check_review_status_enum", {
    check: "review_status IN ('pending', 'approved', 'rejected')",
  });

  pgm.createIndex("trash_detections", "review_status");

  pgm.createIndex("trash_detections", "detected_at");

  pgm.createIndex("trash_detections", "bin_id");
};

exports.down = false;
