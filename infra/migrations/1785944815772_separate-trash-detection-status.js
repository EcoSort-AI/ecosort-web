exports.up = (pgm) => {
  pgm.addColumns("trash_detections", {
    review_status: { type: "varchar(50)", notNull: true, default: "pending" },
    storage_status: { type: "varchar(50)", notNull: true, default: "pending" },
    dataset_status: { type: "varchar(50)", notNull: true, default: "pending" },
  });

  pgm.sql(`
    UPDATE trash_detections 
    SET 
      review_status = CASE 
        WHEN status = 'validated' THEN 'approved' 
        ELSE 'pending' 
      END,
      storage_status = CASE 
        WHEN status = 'validated' THEN 'stored'
        WHEN image_path IS NOT NULL THEN 'pending'
        ELSE 'none'
      END,
      dataset_status = CASE
        WHEN status = 'validated' THEN 'eligible'
        ELSE 'pending'
      END
    WHERE status IS NOT NULL;
  `);

  pgm.dropColumn("trash_detections", "status");
};

exports.down = false;
