# CSV Import System for Urban Nucleus

## Overview
This system allows you to import products from a Shopify CSV export file directly into your Urban Nucleus database. It automatically creates products, categories, variants, and images based on your Shopify data.

## Features

### 🚀 **What Gets Imported:**
- **Products** - Title, description, vendor, product type
- **Categories** - Auto-created from product types
- **Variants** - Sizes, colors, prices, SKUs, inventory
- **Images** - Product images with positions
- **SEO Data** - Titles, descriptions, tags
- **Pricing** - Regular and compare-at prices
- **Inventory** - Stock quantities and tracking

### 📊 **Smart Processing:**
- **Variant Grouping** - Handles Shopify's variant structure
- **Category Mapping** - Auto-creates categories from product types
- **Image Management** - Processes multiple images per product
- **Size Detection** - Automatically identifies size options
- **Error Handling** - Continues processing even if some items fail

## How to Use

### 1. **Prepare Your CSV File**
- Export products from your Shopify store
- Ensure the file is in CSV format
- File should contain standard Shopify columns

### 2. **Access the Import Tool**
- Go to **Admin Panel → Settings → Product Import**
- Click **"Choose CSV File"** to select your file
- Click **"Start Import"** to begin the process

### 3. **Monitor Progress**
- Real-time status updates
- Progress indicators during import
- Detailed results and statistics
- Error reporting for failed items

## CSV Format Support

### **Standard Shopify Columns:**
```
Handle, Title, Body (HTML), Vendor, Product Type, Tags, Published,
Option1 Name, Option1 Value, Option2 Name, Option2 Value,
Variant SKU, Variant Price, Variant Compare At Price,
Variant Inventory Quantity, Image Src, Image Position,
SEO Title, SEO Description, Cost per item
```

### **Example CSV Structure:**
```csv
Handle,Title,Body (HTML),Vendor,Product Type,Published,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Compare At Price,Variant Inventory Quantity,Image Src,Image Position
nike-air-max-90,Nike Air Max 90,<p>Classic sneaker...</p>,Nike,Sneakers,true,Size,US 7,NA90-7,120.00,150.00,25,https://example.com/nike1.jpg,1
nike-air-max-90,Nike Air Max 90,<p>Classic sneaker...</p>,Nike,Sneakers,true,Size,US 8,NA90-8,120.00,150.00,30,https://example.com/nike2.jpg,2
```

## Import Process

### **Step-by-Step Flow:**
1. **File Upload** → CSV file uploaded to server
2. **Parsing** → CSV parsed and validated
3. **Grouping** → Products grouped by handle (Shopify variants)
4. **Category Creation** → New categories created as needed
5. **Product Creation** → Main product records created
6. **Variant Processing** → Size/color options processed
7. **Image Processing** → Product images linked
8. **Cleanup** → Temporary files removed

### **Data Mapping:**
```
Shopify CSV → Urban Nucleus Database
├── Title → products.name
├── Body (HTML) → products.description
├── Vendor → products.vendor
├── Product Type → categories.name
├── Variant Price → products.price (highest variant)
├── Option1 Value → product_sizes.size
├── Image Src → product_images.image_url
└── SEO Data → products.seo_title, seo_meta_description
```

## Admin Panel Integration

### **Location:** Settings → Product Import

### **UI Elements:**
- **File Selector** - Choose CSV file button
- **File Display** - Shows selected filename
- **Import Button** - Start import process
- **Status Display** - Real-time feedback
- **Results Summary** - Import statistics
- **Error Reporting** - Failed items list

### **Button States:**
- **Disabled** - No file selected
- **Ready** - File selected, ready to import
- **Loading** - Import in progress
- **Success** - Import completed

## Technical Details

### **Backend Components:**
- **`csv_import.js`** - Main import logic
- **`/admin/import-csv`** - API endpoint
- **File processing** - CSV parsing and validation
- **Database operations** - Product creation and linking

### **Dependencies:**
- **`csv-parser`** - CSV file parsing
- **`mysql2`** - Database operations
- **`multer`** - File upload handling

### **Installation:**
```bash
cd backend
npm install csv-parser
```

## Import Statistics

### **What Gets Tracked:**
- **Total Rows** - CSV rows processed
- **Products Created** - New products added
- **Categories Created** - New categories added
- **Images Processed** - Images linked to products
- **Duration** - Import time taken
- **Errors** - Failed items with details

### **Sample Results:**
```json
{
  "message": "CSV import completed successfully",
  "statistics": {
    "productsCreated": 45,
    "categoriesCreated": 8,
    "imagesProcessed": 156,
    "duration": 12.5,
    "errors": [
      {"product": "product-handle", "error": "Invalid price format"}
    ]
  }
}
```

## Error Handling

### **Common Issues:**
1. **Invalid CSV Format** - Check file structure
2. **Missing Required Fields** - Ensure Handle and Title exist
3. **Database Constraints** - Check foreign key relationships
4. **File Permissions** - Ensure server can read/write files

### **Error Recovery:**
- **Partial Imports** - Successful items are saved
- **Detailed Logging** - All errors are logged
- **Continue Processing** - Import doesn't stop on errors
- **Error Summary** - Complete list of failures

## Best Practices

### **Before Import:**
- **Backup Database** - Always backup before large imports
- **Test with Small File** - Start with few products
- **Validate CSV** - Check format and required columns
- **Check Categories** - Ensure product types are consistent

### **During Import:**
- **Monitor Progress** - Watch for errors and warnings
- **Don't Interrupt** - Let the process complete
- **Check Results** - Review import statistics

### **After Import:**
- **Verify Products** - Check admin panel for new items
- **Review Categories** - Ensure proper organization
- **Check Images** - Verify image links work
- **Update Inventory** - Set correct stock levels

## Performance Considerations

### **Large Files:**
- **Memory Usage** - Processes files in streams
- **Database Transactions** - Efficient batch operations
- **Progress Tracking** - Real-time status updates
- **Error Recovery** - Continues despite failures

### **Optimization Tips:**
- **Batch Size** - Process in smaller chunks if needed
- **Database Indexes** - Ensure proper indexing
- **Server Resources** - Adequate memory and CPU
- **Network Speed** - Fast connection for large files

## Troubleshooting

### **Import Fails:**
1. **Check File Format** - Ensure valid CSV
2. **Verify Permissions** - Server file access
3. **Database Connection** - MySQL connectivity
4. **Server Logs** - Check error messages

### **Missing Data:**
1. **CSV Structure** - Verify column names
2. **Required Fields** - Check Handle and Title
3. **Data Format** - Validate price and inventory
4. **Category Mapping** - Review product types

### **Performance Issues:**
1. **File Size** - Consider splitting large files
2. **Server Resources** - Monitor CPU and memory
3. **Database Performance** - Check query execution
4. **Network Latency** - Local server recommended

## Future Enhancements

### **Potential Improvements:**
1. **Batch Processing** - Import in smaller chunks
2. **Progress Bars** - Visual progress indicators
3. **Resume Import** - Continue interrupted imports
4. **Template Download** - Sample CSV templates
5. **Validation Preview** - Pre-import data review
6. **Scheduled Imports** - Automated import scheduling
7. **Update Mode** - Modify existing products
8. **Export Function** - Download current data

## Security Considerations

### **File Validation:**
- **File Type** - Only CSV files accepted
- **File Size** - Reasonable size limits
- **Content Validation** - Safe data processing
- **Access Control** - Admin-only access

### **Data Safety:**
- **Input Sanitization** - Clean data before database
- **SQL Injection** - Parameterized queries
- **File Cleanup** - Temporary files removed
- **Error Logging** - Secure error handling

## Conclusion

This CSV import system provides a powerful, user-friendly way to migrate your Shopify products to Urban Nucleus. It handles the complexity of Shopify's data structure while providing clear feedback and error handling.

The system is designed to be robust, efficient, and safe, ensuring your product data is imported correctly while maintaining database integrity.

---

**Note:** Always test imports with small files first and backup your database before large imports!





