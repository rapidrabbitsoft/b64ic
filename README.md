# Base64 Image Converter CLI

A command-line tool to convert base64 encoded images to actual image files with automatic content type detection.

## Features

- 🔍 **Auto-detection**: Automatically detects image type from base64 data or data URLs
- 📁 **File support**: Can read base64 data from files or accept it as command line arguments
- 🎯 **Multiple formats**: Supports JPEG, PNG, GIF, WebP, BMP, TIFF, SVG, and ICO
- 🚀 **Fast**: Lightweight and efficient conversion
- 📊 **Info display**: Shows file size and detected image type
- 🛠️ **Flexible output**: Custom output paths or auto-generated filenames

## Installation

### Prerequisites

- Node.js 16.0.0 or higher

### Install dependencies (for development)

```bash
npm install
```

### Local Usage (no install)

```bash
# Run directly from project root
./b64ic --help
```

### Global Installation (optional)

To use `b64ic` from anywhere:

```bash
npm install -g .
# Now you can run:
b64ic --help
```

## Usage

### Default Behavior (No Command Needed)

You can simply call `./b64ic` with your base64 data, a file path, a URL, or nothing at all:

1. **Pass base64 data directly:**
   ```bash
   ./b64ic "<base64-data-or-data-url>" -o output.png
   ```
2. **Pass a file path to a file containing base64 data:**
   ```bash
   ./b64ic -f path/to/base64.txt -o output.png
   ```
3. **Pass a URL to fetch and scan for base64 data:**
   ```bash
   ./b64ic -u https://example.com/page.html -o output.png
   ```
4. **If no data, file, or URL is provided, it will look for a file called `DATA` in the current directory:**
   ```bash
   ./b64ic -o output.png
   # (Assumes a file named DATA exists in the current directory)
   ```
5. **Specify output directory:**
   ```bash
   ./b64ic "<base64-data-or-data-url>" -d /path/to/outputdir
   # or with a file
   ./b64ic -f path/to/base64.txt -d /path/to/outputdir
   # or with a URL
   ./b64ic -u https://example.com/page.html -d /path/to/outputdir
   ```
   If `-d`/`--outputdir` is not provided, the current directory is used.

### Command Options

#### Convert Command (or default mode)
- `[data]` - Base64 encoded image data or data URL (optional if using --file, --url, or DATA file)
- `-f, --file <path>` - Read base64 data from file
- `-u, --url <url>` - Fetch and scan URL for base64 data
- `-o, --output <path>` - Specify output file path
- `-d, --outputdir <dir>` - Specify output directory (default: current directory)

#### Detect Command
- `[data]` - Base64 encoded image data or data URL (optional if using --file)
- `-f, --file <path>` - Read base64 data from file

## Examples

### Example 1: Convert a data URL
```bash
./b64ic "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..." -o myimage.jpg
```

### Example 2: Read from file and specify output
```bash
./b64ic -f image_data.txt -o converted_image.png
```

### Example 3: Fetch and scan URL for base64 data
```bash
./b64ic -u https://example.com/page.html -o found_image.png
```

### Example 4: Use DATA file in current directory
```bash
# Place your base64 data in a file named DATA
./b64ic -o from_data_file.png
```

### Example 5: Specify output directory
```bash
./b64ic "<base64-data>" -d ./output_images
./b64ic -f image_data.txt -d ./output_images
./b64ic -u https://example.com/page.html -d ./output_images
```

### Example 6: Detect image type
```bash
./b64ic detect -f image_data.txt
```

## Supported Image Formats

| Format | MIME Type | File Extension | Detection Method |
|--------|-----------|----------------|------------------|
| JPEG | image/jpeg | .jpg | File signature (FF D8 FF) |
| PNG | image/png | .png | File signature (89 50 4E 47) |
| GIF | image/gif | .gif | File signature (47 49 46 38) |
| WebP | image/webp | .webp | RIFF header + WEBP chunk |
| BMP | image/bmp | .bmp | File signature (42 4D) |
| TIFF | image/tiff | .tiff | File signature (49 49 2A 00 or 4D 4D 00 2A) |
| SVG | image/svg+xml | .svg | Data URL prefix |
| ICO | image/ico | .ico | Data URL prefix |

## Input Formats

The tool accepts base64 data in two formats:

1. **Data URLs**: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
2. **Raw base64**: `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`

## Output

- **Auto-generated filename**: `converted_image_1234567890.png` (with timestamp)
- **Custom filename**: Use the `-o` option to specify your own filename
- **File extension**: Automatically added based on detected image type
- **Output directory**: Use `-d`/`--outputdir` to specify, otherwise uses current directory

## Error Handling

The tool provides clear error messages for:
- Invalid base64 data
- Unsupported image formats
- File read/write errors
- Missing input data

## Development

### Running Tests
```bash
npm test
```

### Project Structure
```
base64-image-converter/
├── index.js          # Main CLI tool
├── package.json      # Dependencies and scripts
├── README.md         # This file
└── test.js           # Test file (optional)
```

## License

MIT License - feel free to use this tool for any purpose.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request 