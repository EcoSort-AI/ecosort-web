exports.up = (pgm) => {
  pgm.addColumn("trash_detections", {
    ai_prediction: {
      type: "varchar(255)",
      notNull: false,
    },
  });

  pgm.sql(`
    UPDATE trash_detections 
    SET ai_prediction = item_class 
    WHERE ai_prediction IS NULL;
  `);
};

exports.down = false;
