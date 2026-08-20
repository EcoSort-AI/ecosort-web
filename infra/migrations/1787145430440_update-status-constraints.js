exports.up = (pgm) => {
  pgm.sql(`
    UPDATE trash_detections 
    SET review_status = 'pending' 
    WHERE review_status NOT IN ('pending', 'processing', 'approved', 'corrected', 'invalid', 'not_applicable');

    UPDATE trash_detections 
    SET dataset_status = 'pending' 
    WHERE dataset_status NOT IN ('pending', 'eligible', 'included', 'excluded', 'ignored');

    UPDATE trash_detections 
    SET storage_status = 'pending' 
    WHERE storage_status NOT IN ('pending', 'copying', 'stored', 'failed', 'ignored', 'cleanup_pending');
  `);

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
