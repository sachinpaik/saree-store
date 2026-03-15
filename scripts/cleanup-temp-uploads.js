#!/usr/bin/env node

/**
 * Cleanup script for abandoned temporary uploads.
 * 
 * This script deletes temp files older than the configured TTL.
 * Should be run periodically via cron job or scheduler.
 * 
 * Usage:
 *   node scripts/cleanup-temp-uploads.js [--ttl-hours=24] [--dry-run]
 * 
 * Options:
 *   --ttl-hours=N     Time-to-live in hours (default: from env TEMP_UPLOAD_TTL_HOURS or 24)
 *   --dry-run         Show what would be deleted without actually deleting
 * 
 * Environment variables:
 *   TEMP_UPLOAD_TTL_HOURS  Default TTL in hours (default: 24)
 *   STORAGE_PROVIDER       Storage provider to use (default: cloudflare-r2)
 * 
 * Examples:
 *   # Delete temp files older than 24 hours
 *   node scripts/cleanup-temp-uploads.js
 * 
 *   # Delete temp files older than 48 hours
 *   node scripts/cleanup-temp-uploads.js --ttl-hours=48
 * 
 *   # Dry run (preview only)
 *   node scripts/cleanup-temp-uploads.js --dry-run
 */

import { cleanupAbandonedTempUploads } from "../src/lib/storage/temp-upload-helpers.js";

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let ttlHours = parseInt(process.env.TEMP_UPLOAD_TTL_HOURS || "24", 10);
  let dryRun = false;
  
  for (const arg of args) {
    if (arg.startsWith("--ttl-hours=")) {
      ttlHours = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Cleanup script for abandoned temporary uploads.

Usage:
  node scripts/cleanup-temp-uploads.js [--ttl-hours=24] [--dry-run]

Options:
  --ttl-hours=N     Time-to-live in hours (default: from env TEMP_UPLOAD_TTL_HOURS or 24)
  --dry-run         Show what would be deleted without actually deleting
  --help, -h        Show this help message

Environment variables:
  TEMP_UPLOAD_TTL_HOURS  Default TTL in hours (default: 24)
  STORAGE_PROVIDER       Storage provider to use (default: cloudflare-r2)

Examples:
  # Delete temp files older than 24 hours
  node scripts/cleanup-temp-uploads.js

  # Delete temp files older than 48 hours
  node scripts/cleanup-temp-uploads.js --ttl-hours=48

  # Dry run (preview only)
  node scripts/cleanup-temp-uploads.js --dry-run
      `);
      process.exit(0);
    }
  }
  
  if (isNaN(ttlHours) || ttlHours < 1) {
    console.error("Error: Invalid TTL hours. Must be a positive number.");
    process.exit(1);
  }
  
  console.log(`Cleanup script starting...`);
  console.log(`Storage provider: ${process.env.STORAGE_PROVIDER || "cloudflare-r2"}`);
  console.log(`TTL: ${ttlHours} hours`);
  console.log(`Dry run: ${dryRun ? "YES" : "NO"}`);
  console.log("");
  
  if (dryRun) {
    console.warn("DRY RUN MODE: Files will not be deleted.");
    console.warn("Note: This script does not have a true dry-run mode yet.");
    console.warn("Remove --dry-run flag to perform actual deletion.");
    process.exit(0);
  }
  
  try {
    const deletedCount = await cleanupAbandonedTempUploads(ttlHours);
    
    console.log("");
    console.log(`✓ Cleanup completed successfully`);
    console.log(`Files deleted: ${deletedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("✗ Cleanup failed:", error);
    process.exit(1);
  }
}

main();
