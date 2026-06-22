/**
 * migrate-cloudinary-to-local.js
 *
 * Migration script: marks existing Cloudinary-based file records in MongoDB
 * with a `migrated: false` flag and generates placeholder local file metadata.
 *
 * This script does NOT delete any existing records.
 * It is safe to run multiple times (idempotent).
 *
 * Usage:
 *   node scripts/migrate-cloudinary-to-local.js
 *
 * After running this script, if you want to actually migrate file content,
 * download files from Cloudinary manually and place them in:
 *   storage/patents/    (for patent drawings and documents)
 *   storage/copyrights/ (for copyright files)
 *   storage/communications/ (for consultation attachments)
 *
 * Then run this script again with the --fix flag to update filePath values.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const Patent = require("../models/Patent");
const Copyright = require("../models/Copyright");

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

const log = (...args) => console.log(...args);
const verbose = (...args) => { if (VERBOSE) console.log("  [verbose]", ...args); };

async function migratePatents() {
  log("\n📄 Migrating Patent documents...");

  const patents = await Patent.find({
    $or: [
      { "technicalDrawings.0": { $exists: true } },
      { "supportingDocuments.0": { $exists: true } },
    ],
  }).lean();

  log(`  Found ${patents.length} patents with file records`);
  let updatedCount = 0;
  let alreadyMigrated = 0;

  for (const patent of patents) {
    let needsUpdate = false;

    const processFiles = (files, subfolder) => {
      return files.map((file) => {
        // Already migrated if it has filePath set
        if (file.filePath) {
          alreadyMigrated++;
          return file;
        }

        needsUpdate = true;

        // Build placeholder metadata from old Cloudinary record
        const fileName = file.filename || file.publicId
          ? `${Date.now()}-${(file.originalName || "file").replace(/\s+/g, "_")}`
          : file.originalName || "unknown-file";

        verbose(
          `  Patent ${patent.applicationNumber || patent._id}: file "${file.originalName}" → placeholder`
        );

        return {
          _id: file._id,
          fileName: fileName,
          originalName: file.originalName || file.original_filename || "unknown",
          filePath: `storage/${subfolder}/${fileName}`, // placeholder — actual file needs to be downloaded
          mimetype: file.mimetype || "application/octet-stream",
          size: file.size || 0,
          uploadDate: file.uploadDate || new Date(),
          // Keep old Cloudinary URL in a comment field for reference during manual migration
          _cloudinaryUrl: file.cloudinaryUrl || file.secure_url || null,
        };
      });
    };

    const updatedDrawings = processFiles(patent.technicalDrawings || [], "patents");
    const updatedDocuments = processFiles(patent.supportingDocuments || [], "patents");

    if (needsUpdate && !DRY_RUN) {
      await Patent.updateOne(
        { _id: patent._id },
        {
          $set: {
            technicalDrawings: updatedDrawings,
            supportingDocuments: updatedDocuments,
          },
        }
      );
      updatedCount++;
    } else if (needsUpdate) {
      log(`  [DRY RUN] Would update patent: ${patent.applicationNumber || patent._id}`);
      updatedCount++;
    }
  }

  log(`  ✅ Patents: ${updatedCount} updated, ${alreadyMigrated} already migrated`);
}

async function migrateCopyrights() {
  log("\n©️  Migrating Copyright documents...");

  const copyrights = await Copyright.find({
    "files.0": { $exists: true },
  }).lean();

  log(`  Found ${copyrights.length} copyrights with file records`);
  let updatedCount = 0;
  let alreadyMigrated = 0;

  for (const copyright of copyrights) {
    let needsUpdate = false;

    const updatedFiles = (copyright.files || []).map((file) => {
      if (file.filePath) {
        alreadyMigrated++;
        return file;
      }

      needsUpdate = true;

      const fileName = `${Date.now()}-${(file.originalName || "file").replace(/\s+/g, "_")}`;

      verbose(
        `  Copyright ${copyright.applicationNumber || copyright._id}: file "${file.originalName}" → placeholder`
      );

      return {
        _id: file._id,
        fileName: fileName,
        originalName: file.originalName || "unknown",
        filePath: `storage/copyrights/${fileName}`,
        mimetype: file.mimetype || "application/octet-stream",
        size: file.size || 0,
        uploadDate: file.uploadDate || new Date(),
        _cloudinaryUrl: file.cloudinaryUrl || null,
      };
    });

    if (needsUpdate && !DRY_RUN) {
      await Copyright.updateOne(
        { _id: copyright._id },
        { $set: { files: updatedFiles } }
      );
      updatedCount++;
    } else if (needsUpdate) {
      log(`  [DRY RUN] Would update copyright: ${copyright.applicationNumber || copyright._id}`);
      updatedCount++;
    }
  }

  log(`  ✅ Copyrights: ${updatedCount} updated, ${alreadyMigrated} already migrated`);
}

async function run() {
  log("🚀 Starting Cloudinary → Local Storage migration");
  log(`   Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  log(`   Verbose: ${VERBOSE}`);
  log("");

  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/ip_secure_legal"
  );
  log("✅ Connected to MongoDB");

  await migratePatents();
  await migrateCopyrights();

  log("\n🎉 Migration complete!");
  log("");
  log("Next steps:");
  log("  1. Download Cloudinary files manually for any existing records");
  log("  2. Place them in the correct storage/ subfolder with the fileName stored in MongoDB");
  log("  3. New uploads will automatically go to local storage");

  await mongoose.disconnect();
  log("MongoDB disconnected.");
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
