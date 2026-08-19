exports.up = (pgm) => {
  pgm.dropConstraint("trash_detections", "check_review_status_enum", {
    ifExists: true,
  });
  pgm.addConstraint("trash_detections", "check_review_status_enum", {
    check:
      "review_status IN ('pending', 'processing', 'approved', 'corrected', 'invalid', 'not_applicable')",
  });

  pgm.dropConstraint("trash_detections", "check_dataset_status_enum", {
    ifExists: true,
  });
  pgm.addConstraint("trash_detections", "check_dataset_status_enum", {
    check:
      "dataset_status IN ('pending', 'eligible', 'included', 'excluded', 'ignored')",
  });

  pgm.dropConstraint("trash_detections", "check_storage_status_enum", {
    ifExists: true,
  });
  pgm.addConstraint("trash_detections", "check_storage_status_enum", {
    check:
      "storage_status IN ('pending', 'copying', 'stored', 'failed', 'ignored', 'cleanup_pending')",
  });
};

exports.down = false;
