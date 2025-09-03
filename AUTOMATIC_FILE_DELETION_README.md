# Automatic File Deletion System for Urban Nucleus

## Overview
This system automatically deletes physical image and video files when products are deleted from the admin panel, preventing orphaned files from accumulating on disk.

## What Gets Deleted Automatically

### ✅ When You Delete a Product:
1. **Database Records** - Product and all related data (images, videos, variants, sizes, cart items, etc.)
2. **Physical Files** - All image and video files stored in `uploads/` folders
3. **File References** - Database entries in `product_images` and `product_videos` tables

### 🔄 Cascade Deletion Process:
```
Delete Product → Cascade Delete Related Records → Delete Physical Files
```

## Implementation Details

### 1. Enhanced Delete Product Endpoint
**Location:** `backend/server.js` (line ~1749)
**Endpoint:** `DELETE /admin/products/:id`

**What it does:**
- Fetches all file paths before deletion
- Deletes the product (triggers CASCADE deletion)
- Automatically removes physical files from disk
- Provides detailed feedback on deletion results

### 2. Utility Functions
**File:** `backend/server.js`

- **`deleteFileSafely(filePath)`** - Safely deletes files with error handling
- **`getProductFiles(productId)`** - Retrieves all files associated with a product

### 3. Orphaned Files Cleanup
**Endpoint:** `POST /admin/cleanup-orphaned-files`

**Purpose:** Manually clean up files that exist on disk but aren't linked to any products

**What it scans:**
- `uploads/images/` - Product images
- `uploads/videos/` - Product videos  
- `uploads/hero-slides/` - Hero banner images

## Admin Panel Integration

### Settings Section
**Location:** Admin Panel → Settings → File Management

**Features:**
- **Cleanup Button** - Orange warning button with broom icon
- **Real-time Status** - Shows cleanup progress and results
- **Detailed Results** - Lists all deleted files with statistics
- **Auto-hide** - Results disappear after 10 seconds

### UI Elements Added:
- Warning button with cleanup icon
- Status display area
- Success/error message styling
- File deletion statistics
- List of deleted files

## File Storage Structure

```
un/
├── backend/
└── uploads/
    ├── images/          # Product images (auto-deleted)
    ├── videos/          # Product videos (auto-deleted)
    └── hero-slides/     # Hero banners (manual cleanup only)
```

## How It Works

### 1. Product Deletion Flow:
```
Admin clicks delete → Server fetches file paths → Deletes product → Deletes physical files → Returns results
```

### 2. File Cleanup Flow:
```
Admin clicks cleanup → Server scans all files → Checks database references → Deletes orphaned files → Returns statistics
```

### 3. Error Handling:
- File not found → Logs warning, continues
- Permission denied → Logs error, continues with other files
- Database errors → Returns appropriate error messages

## Benefits

### 🎯 **Automatic Cleanup:**
- No more orphaned files taking up disk space
- Consistent database and file system state
- Better server performance

### 🛡️ **Safe Operations:**
- Files are only deleted if they exist
- Comprehensive error handling
- Detailed logging for debugging

### 📊 **Transparency:**
- Real-time feedback on deletion operations
- Statistics on files processed
- List of all deleted files

## Usage Examples

### Delete a Product:
```javascript
// This automatically deletes all associated files
DELETE /admin/products/123
```

### Cleanup Orphaned Files:
```javascript
// Manually clean up orphaned files
POST /admin/cleanup-orphaned-files
```

## Response Examples

### Product Deletion Success:
```json
{
  "message": "Product and associated files deleted successfully",
  "filesDeleted": 5,
  "filesFailed": 0,
  "totalFiles": 5
}
```

### Cleanup Results:
```json
{
  "message": "Orphaned files cleanup completed",
  "totalFiles": 45,
  "orphanedFiles": 12,
  "deletedFiles": 12,
  "failedDeletions": 0,
  "orphanedFilesList": ["/uploads/images/file1.jpg", "/uploads/videos/file1.mp4"]
}
```

## Security Considerations

### ✅ **Safe Operations:**
- Only admin users can delete products
- Files are only deleted if they exist
- Comprehensive error handling prevents data loss

### ⚠️ **Important Notes:**
- **Physical files are permanently deleted** - no recovery option
- Cleanup operations are irreversible
- Always backup important files before major cleanup

## Troubleshooting

### Common Issues:

1. **Files not deleted:**
   - Check file permissions
   - Verify file paths in database
   - Check server logs for errors

2. **Permission errors:**
   - Ensure server has write access to uploads folder
   - Check file ownership and permissions

3. **Database errors:**
   - Verify database connection
   - Check table structure and foreign key constraints

### Debug Information:
- All operations are logged to console
- File paths and deletion results are tracked
- Error messages provide specific failure reasons

## Future Enhancements

### Potential Improvements:
1. **Soft Delete** - Archive products instead of permanent deletion
2. **File Recovery** - Move files to trash folder instead of deletion
3. **Batch Operations** - Delete multiple products at once
4. **Scheduled Cleanup** - Automatic orphaned file cleanup
5. **File Compression** - Compress old/unused files

## Conclusion

This system provides a robust, automatic solution for maintaining a clean file system that stays synchronized with your database. It eliminates the need for manual file cleanup and ensures optimal server performance while maintaining data integrity.

---

**Note:** Always test deletion operations in a development environment before using in production!





