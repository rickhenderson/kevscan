/// <reference path="../pb_data/types.d.ts" />

// The scan pipeline needs the parsed library list (name + version per SBOM
// component) persisted on the upload so /scan can read it back. The original
// uploads collection stored only a libraryCount, so scans always ran against an
// empty list. Add a json column to hold the parsed components.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("uploads");

  if (collection.fields.getByName("parsedLibraries")) {
    return; // already added
  }

  collection.fields.add(new JSONField({
    name: "parsedLibraries",
    required: false,
    // 0 = use PocketBase's default max json size
    maxSize: 0,
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("uploads");
    collection.fields.removeByName("parsedLibraries");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      return;
    }
    throw e;
  }
})
