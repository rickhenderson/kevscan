/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const records = app.findRecordsByFilter("users", "email='tassit@gmail.com'");
  for (const record of records) {
    app.delete(record);
  }
}, (app) => {
  // Rollback: record data not stored, manual restore needed
})