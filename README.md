# Base64 Image Converter CLI (b64ic)

A powerful command-line tool to convert base64 encoded images to actual image files with automatic content type detection and URL/HTML scanning capabilities.

## ✨ Features

- 🔍 **Auto-detection**: Automatically detects image type from base64 data or data URLs
- 📁 **Multiple input sources**: Accept data from command line, files, URLs, or a default DATA file
- 🌐 **URL & HTML scanning**: Fetch and scan web pages or local HTML files for embedded base64 images
- 🗂️ **Multi-image extraction**: Extracts and saves all base64 images found in HTML or web pages
- 🎯 **Wide format support**: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG, and ICO
- 🚀 **Fast & lightweight**: Efficient conversion with minimal dependencies
- 📊 **Rich output**: Shows file size, detected image type, and conversion status
- 🛠️ **Flexible output**: Custom filenames, directories, or auto-generated names
- 📝 **Smart defaults**: Uses current directory and timestamped filenames when not specified

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0.0 or higher

### Installation

```bash
# Clone or download the project
git clone <repository-url>
cd base64-image-converter
npm install
chmod +x index.js
```

### Basic Usage

```bash
# Convert base64 data directly
./b64ic "data:image/png;base64,..."

# Convert with custom output
./b64ic "data:image/png;base64,..." -o my_image.png

# Read from file
./b64ic -f base64_data.txt

# Scan URL for base64 images
./b64ic -u https://example.com/page.html

# Extract all base64 images from a local HTML file
./b64ic -f mypage.html

# Use DATA file in current directory
./b64ic
```

## 🖼️ HTML & Web Page Extraction

You can extract **all** base64 images from any HTML file or web page:

### Extract from a local HTML file
```bash
./b64ic -f mypage.html
```
- Finds all `<img src="data:image/...">`, inline styles, CSS, and any base64 image data in the HTML
- Saves each image as a separate file (e.g., `image_<timestamp>_1.png`, `image_<timestamp>_2.jpg`, ...)
- Detects and uses the correct file extension for each image

### Extract from a web page
```bash
./b64ic -u https://example.com/page.html
```
- Fetches the page and scans for all embedded base64 images
- Saves each image as a separate file with the correct extension

## 📖 Usage Guide

### Input Sources (in order of priority)

1. **Direct data**: Pass base64 string as first argument
2. **URL scanning**: Use `-u` or `--url` to fetch and scan web pages
3. **File input**: Use `-f` or `--file` to read from a file (including HTML)
4. **DATA file**: Automatically looks for a file named `DATA` in current directory

### Output Options

- **Auto-generated**: `image_<timestamp>.<extension>` (default)
- **Custom name**: Use `-o` or `--output` for specific filename
- **Custom directory**: Use `-d` or `--outputdir` for output location

### Command Modes

#### Default Mode (No Command)
```bash
./b64ic "base64-data"
./b64ic -f file.txt
./b64ic -u https://example.com
./b64ic -o output.png
```

#### Explicit Convert Command
```bash
./b64ic convert "base64-data"
./b64ic convert -f file.txt -o output.png
./b64ic convert -u https://example.com -d ./images
```

#### Detect Command (No Conversion)
```bash
./b64ic detect "base64-data"
./b64ic detect -f file.txt
```

## 💡 Examples

### Extract all base64 images from an HTML file
```bash
./b64ic -f test.html
# Output:
# 📁 Reading base64 data from: test.html
# 📄 Detected HTML content, performing enhanced scan...
# 📸 Processing 4 images from HTML file...
# ✅ Successfully converted base64 image to: .../image_<timestamp>_1.png
# ✅ Successfully converted base64 image to: .../image_<timestamp>_2.jpg
# ✅ Successfully converted base64 image to: .../image_<timestamp>_3.gif
# ✅ Successfully converted base64 image to: .../image_<timestamp>_4.webp
```

### Extract all base64 images from a web page
```bash
./b64ic -u https://example.com/page.html
```

### Basic Conversions
```bash
./b64ic "data:image/png;base64,..." -o logo.png
./b64ic "/9j/4AAQSkZJRgABAQEAYABgAAD..." -o photo.jpg
./b64ic -f image_data.txt -o converted_image.png
```

### File Operations
```bash
./b64ic -f /path/to/base64_data.txt
./b64ic -f image_data.txt -d /path/to/output/
```

### Advanced Usage
```bash
# Multiple images from URL (auto-numbered)
./b64ic -u https://example.com/page.html -o batch_image
# Creates: batch_image_1.png, batch_image_2.jpg, etc.

# Detect image type without converting
./b64ic detect -f image_data.txt

# Convert with full path specification
./b64ic "base64-data" -d /absolute/path/to/output -o custom_name
```

## 🖼️ Supported Formats

| Format | MIME Type | Extension | Detection Method |
|--------|-----------|-----------|------------------|
| JPEG | `image/jpeg` | `.jpg` | File signature (FF D8 FF) |
| PNG | `image/png` | `.png` | File signature (89 50 4E 47) |
| GIF | `image/gif` | `.gif` | File signature (47 49 46 38) |
| WebP | `image/webp` | `.webp` | RIFF header + WEBP chunk |
| BMP | `image/bmp` | `.bmp` | File signature (42 4D) |
| TIFF | `image/tiff` | `.tiff` | File signature (49 49 2A 00 or 4D 4D 00 2A) |
| SVG | `image/svg+xml` | `.svg` | Data URL prefix |
| ICO | `image/ico` | `.ico` | Data URL prefix |

## 📥 Input Formats

The tool accepts base64 data in two formats:

### Data URLs
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
```

### Raw Base64
```
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
```

## 📤 Output Behavior

### Filename Generation
- **Default**: `image_<timestamp>.<extension>`
- **Custom**: Use `-o` option for specific names
- **Multiple images**: Auto-numbered with suffixes (`_1`, `_2`, etc.)

### Directory Handling
- **Default**: Current working directory
- **Custom**: Use `-d` option for specific directories
- **Path resolution**: Automatically handles relative and absolute paths

### Extension Detection
- **Automatic**: Based on detected image type
- **Override**: Can be specified in output filename
- **Fallback**: Uses detected extension if none provided

## ⚠️ Error Handling

The tool provides clear error messages for:

- **Invalid base64 data**: Malformed or corrupted base64 strings
- **Unsupported formats**: Image types not in the supported list
- **File operations**: Read/write errors, missing files
- **Network issues**: URL fetch failures, timeouts
- **Missing input**: No data source provided
- **Permission errors**: Directory/file access issues

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

This will test:
- Basic conversions
- File operations
- URL scanning
- Error handling
- Multiple image processing

## 🏗️ Development

### Project Structure
```
base64-image-converter/
├── index.js          # Main CLI tool
├── package.json      # Dependencies and scripts
├── README.md         # This documentation
├── test.js           # Test suite
└── .gitignore        # Git ignore rules
```

### Dependencies
- `commander`: CLI argument parsing
- `node-fetch`: HTTP requests for URL scanning

### Scripts
- `npm start`: Run the CLI tool
- `npm test`: Run the test suite

## 📄 License

MIT License - feel free to use this tool for any purpose.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**"No base64 data found"**
- Check that your data is valid base64
- Ensure data URLs start with `data:image/...`
- Verify file encoding (should be UTF-8)

**"Could not detect image type"**
- The base64 data might be corrupted
- Try with a known good image first
- Check if the format is supported

**"URL fetch failed"**
- Verify the URL is accessible
- Check your internet connection
- Some sites may block automated requests

**"Permission denied"**
- Check file/directory permissions
- Ensure you have write access to the output location

### Getting Help

If you encounter issues:
1. Check the error message for specific details
2. Verify your input format
3. Test with a simple example first
4. Check the supported formats list 