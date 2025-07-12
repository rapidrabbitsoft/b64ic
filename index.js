#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// MIME type to file extension mapping
const mimeToExtension = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/svg+xml': 'svg',
  'image/ico': 'ico'
};

/**
 * Detect image type from base64 data by checking the data URL prefix
 * @param {string} base64Data - The base64 encoded image data
 * @returns {string|null} - The detected MIME type or null if not found
 */
function detectImageType(base64Data) {
  // Check if it's a data URL
  const dataUrlMatch = base64Data.match(/^data:([^;]+);base64,/);
  if (dataUrlMatch) {
    return dataUrlMatch[1];
  }
  
  // Check for common image signatures in raw base64
  const buffer = Buffer.from(base64Data, 'base64');
  
  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return 'image/png';
  }
  
  // GIF: starts with 47 49 46 38 (GIF8)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }
  
  // WebP: starts with 52 49 46 46 (RIFF) followed by 57 45 42 50 (WEBP)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  
  // BMP: starts with 42 4D (BM)
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
    return 'image/bmp';
  }
  
  // TIFF: starts with 49 49 2A 00 (little-endian) or 4D 4D 00 2A (big-endian)
  if ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2A && buffer[3] === 0x00) ||
      (buffer[0] === 0x4D && buffer[1] === 0x4D && buffer[2] === 0x00 && buffer[3] === 0x2A)) {
    return 'image/tiff';
  }
  
  return null;
}

/**
 * Extract base64 data from a data URL or return as-is if it's already raw base64
 * @param {string} input - The input string (data URL or raw base64)
 * @returns {string} - The raw base64 data
 */
function extractBase64Data(input) {
  const dataUrlMatch = input.match(/^data:[^;]+;base64,(.+)$/);
  return dataUrlMatch ? dataUrlMatch[1] : input;
}

/**
 * Convert base64 image to file
 * @param {string} base64Data - The base64 encoded image data
 * @param {string} outputPath - The output file path (optional)
 * @returns {Promise<string>} - The path of the created file
 */
async function convertBase64ToImage(base64Data, outputPath = null) {
  try {
    // Extract base64 data if it's a data URL
    const rawBase64 = extractBase64Data(base64Data);
    
    // Detect image type
    const mimeType = detectImageType(base64Data);
    if (!mimeType) {
      throw new Error('Could not detect image type from base64 data');
    }
    
    // Get file extension
    const extension = mimeToExtension[mimeType];
    if (!extension) {
      throw new Error(`Unsupported image type: ${mimeType}`);
    }
    
    // Generate output filename if not provided
    if (!outputPath) {
      const timestamp = Date.now();
      outputPath = `converted_image_${timestamp}.${extension}`;
    } else {
      // Ensure output path has correct extension
      const parsedPath = path.parse(outputPath);
      if (!parsedPath.ext) {
        outputPath = `${outputPath}.${extension}`;
      }
    }
    
    // Convert base64 to buffer and write to file
    const buffer = Buffer.from(rawBase64, 'base64');
    await fs.writeFile(outputPath, buffer);
    
    console.log(`✅ Successfully converted base64 image to: ${outputPath}`);
    console.log(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`🖼️  Image type: ${mimeType}`);
    
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to convert base64 image: ${error.message}`);
  }
}

// CLI setup
program
  .name('base64-image-converter')
  .description('Convert base64 encoded images to actual image files')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert base64 image data to file')
  .argument('[data]', 'Base64 encoded image data or data URL')
  .option('-f, --file <path>', 'Read base64 data from file')
  .option('-o, --output <path>', 'Output file path')
  .action(async (data, options) => {
    try {
      let base64Data = data;
      
      // If no data provided as argument, check for file option
      if (!base64Data) {
        if (!options.file) {
          console.error('❌ Error: Please provide base64 data as argument or use --file option');
          process.exit(1);
        }
        
        try {
          base64Data = await fs.readFile(options.file, 'utf8');
          console.log(`📁 Reading base64 data from: ${options.file}`);
        } catch (error) {
          console.error(`❌ Error reading file: ${error.message}`);
          process.exit(1);
        }
      }
      
      // Remove whitespace and newlines
      base64Data = base64Data.trim().replace(/\s/g, '');
      
      if (!base64Data) {
        console.error('❌ Error: Empty base64 data provided');
        process.exit(1);
      }
      
      await convertBase64ToImage(base64Data, options.output);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('detect')
  .description('Detect image type from base64 data without converting')
  .argument('[data]', 'Base64 encoded image data or data URL')
  .option('-f, --file <path>', 'Read base64 data from file')
  .action(async (data, options) => {
    try {
      let base64Data = data;
      
      if (!base64Data) {
        if (!options.file) {
          console.error('❌ Error: Please provide base64 data as argument or use --file option');
          process.exit(1);
        }
        
        try {
          base64Data = await fs.readFile(options.file, 'utf8');
          console.log(`📁 Reading base64 data from: ${options.file}`);
        } catch (error) {
          console.error(`❌ Error reading file: ${error.message}`);
          process.exit(1);
        }
      }
      
      base64Data = base64Data.trim().replace(/\s/g, '');
      
      if (!base64Data) {
        console.error('❌ Error: Empty base64 data provided');
        process.exit(1);
      }
      
      const mimeType = detectImageType(base64Data);
      if (mimeType) {
        const extension = mimeToExtension[mimeType];
        console.log(`🔍 Detected image type: ${mimeType}`);
        console.log(`📄 File extension: ${extension || 'unknown'}`);
        
        const rawBase64 = extractBase64Data(base64Data);
        const buffer = Buffer.from(rawBase64, 'base64');
        console.log(`📊 Estimated file size: ${(buffer.length / 1024).toFixed(2)} KB`);
      } else {
        console.log('❓ Could not detect image type from the provided data');
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// Handle cases where no command is provided - treat as convert
if (process.argv.length === 2) {
  // No arguments provided, look for DATA file
  (async () => {
    try {
      let base64Data;
      try {
        base64Data = await fs.readFile('DATA', 'utf8');
        console.log('📁 Reading base64 data from: DATA');
      } catch (err) {
        console.error('❌ Error: No arguments provided and no DATA file found in current directory.');
        console.error('Usage: ./b64ic [data] [options] or ./b64ic -f <file> [options] or ./b64ic [options] (with DATA file)');
        process.exit(1);
      }
      
      // Remove whitespace and newlines
      base64Data = base64Data.trim().replace(/\s/g, '');
      if (!base64Data) {
        console.error('❌ Error: Empty base64 data in DATA file');
        process.exit(1);
      }
      
      // Use default output path
      const outputOption = process.cwd() + '/image_' + Date.now();
      await convertBase64ToImage(base64Data, outputOption);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  })();
} else if (process.argv.length > 2 && !process.argv[2].startsWith('-') && !['convert', 'detect'].includes(process.argv[2])) {
  // If first argument is not a command, treat it as data for convert
  let data = process.argv[2];
  let remainingArgs = process.argv.slice(3);
  
  // Parse remaining arguments for convert options
  let fileOption = null;
  let outputOption = null;
  let outputDir = null;
  
  for (let i = 0; i < remainingArgs.length; i++) {
    if (remainingArgs[i] === '-f' || remainingArgs[i] === '--file') {
      fileOption = remainingArgs[i + 1];
      i++;
    } else if (remainingArgs[i] === '-o' || remainingArgs[i] === '--output') {
      outputOption = remainingArgs[i + 1];
      i++;
    } else if (remainingArgs[i] === '-d' || remainingArgs[i] === '--outputdir') {
      outputDir = remainingArgs[i + 1];
      i++;
    }
  }

  (async () => {
    try {
      let base64Data = data;
      // If no data is provided, try file option
      if (!base64Data) {
        if (fileOption) {
          base64Data = await fs.readFile(fileOption, 'utf8');
          console.log(`📁 Reading base64 data from: ${fileOption}`);
        } else {
          // Look for a file called DATA in the current directory
          try {
            base64Data = await fs.readFile('DATA', 'utf8');
            console.log('📁 Reading base64 data from: DATA');
          } catch (err) {
            console.error('❌ Error: No base64 data provided, no file path given, and no DATA file found in current directory.');
            process.exit(1);
          }
        }
      }
      // Remove whitespace and newlines
      base64Data = base64Data.trim().replace(/\s/g, '');
      if (!base64Data) {
        console.error('❌ Error: Empty base64 data provided');
        process.exit(1);
      }
      // If output directory is specified, prepend it to outputOption or use default filename
      if (outputDir) {
        const dir = outputDir || process.cwd();
        if (!outputOption) {
          outputOption = dir + '/image_' + Date.now();
        } else {
          outputOption = dir + '/' + outputOption.replace(/^.*[\\\/]/, '');
        }
      } else if (outputOption && !outputOption.includes('/')) {
        // If outputOption is just a filename, use current directory
        outputOption = process.cwd() + '/' + outputOption;
      }
      // If outputOption is still not set, set it to image_<timestamp> and let convertBase64ToImage add the extension
      if (!outputOption) {
        outputOption = process.cwd() + '/image_' + Date.now();
      }
      await convertBase64ToImage(base64Data, outputOption);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  })();
} else {
  // Handle cases where no command is provided
  if (process.argv.length === 2) {
    program.help();
  } else {
    program.parse();
  }
} 