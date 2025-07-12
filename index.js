#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import chalk from 'chalk';

// Configure chalk for better terminal compatibility
chalk.level = 3; // Enable all colors

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
 * Scan content for base64 data URLs
 * @param {string} content - The content to scan
 * @returns {string[]} - Array of found base64 data URLs
 */
function scanForBase64Data(content) {
  const base64Pattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;
  const matches = content.match(base64Pattern);
  return matches || [];
}

/**
 * Enhanced scan for HTML content with base64 data
 * @param {string} htmlContent - The HTML content to scan
 * @returns {string[]} - Array of found base64 data URLs
 */
function scanHtmlForBase64Data(htmlContent) {
  const base64Data = [];
  
  // Pattern for data URLs in various contexts
  const patterns = [
    // Standard data URLs
    /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g,
    // In img src attributes
    /src\s*=\s*["'](data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)["']/gi,
    // In background-image CSS
    /background-image\s*:\s*url\(["']?(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)["']?\)/gi,
    // In style attributes
    /style\s*=\s*["'][^"']*url\(["']?(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)["']?\)[^"']*["']/gi,
    // In CSS content
    /content\s*:\s*url\(["']?(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)["']?\)/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = htmlContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Extract just the data URL part from matches that include HTML attributes
        let dataUrl = match;
        if (match.includes('src=') || match.includes('background-image') || match.includes('style=') || match.includes('content=')) {
          const dataUrlMatch = match.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
          if (dataUrlMatch) {
            dataUrl = dataUrlMatch[0];
          }
        }
        
        // Only add if it's a valid data URL and not already in the array
        if (dataUrl.startsWith('data:image/') && !base64Data.includes(dataUrl)) {
          base64Data.push(dataUrl);
        }
      });
    }
  });
  
  return base64Data;
}

/**
 * Fetch content from URL and scan for base64 data
 * @param {string} url - The URL to fetch
 * @returns {Promise<string[]>} - Array of found base64 data URLs
 */
async function fetchAndScanUrl(url) {
  try {
    console.log(chalk.blue(`🌐 Fetching content from: ${url}`));
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    const content = await response.text();
    
    let base64Data = [];
    
    // Check if it's HTML content
    if (contentType.includes('text/html') || content.trim().toLowerCase().startsWith('<!doctype') || content.includes('<html')) {
      console.log(chalk.yellow('📄 Detected HTML content, performing enhanced scan...'));
      base64Data = scanHtmlForBase64Data(content);
    } else {
      console.log(chalk.yellow('📄 Performing standard content scan...'));
      base64Data = scanForBase64Data(content);
    }
    
    if (base64Data.length === 0) {
      throw new Error('No base64 image data found in the URL content');
    }
    
    console.log(chalk.green(`🔍 Found ${base64Data.length} base64 image(s) in the URL`));
    return base64Data;
  } catch (error) {
    throw new Error(`Failed to fetch or scan URL: ${error.message}`);
  }
}

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
    
    console.log(chalk.green(`✅ Successfully converted base64 image to: ${outputPath}`));
    console.log(chalk.blue(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB`));
    console.log(chalk.magenta(`🖼️  Image type: ${mimeType}`));
    
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
  .option('-u, --url <url>', 'Fetch and scan URL for base64 data')
  .option('-o, --output <path>', 'Output file path')
  .option('-d, --outputdir <dir>', 'Output directory')
  .action(async (data, options) => {
          try {
        let base64Data = data;
        
        // If no data provided as argument, check for URL option first, then file option
        if (!base64Data) {
          if (options.url) {
            const base64DataArray = await fetchAndScanUrl(options.url);
            if (base64DataArray.length === 1) {
              base64Data = base64DataArray[0];
            } else {
              // Multiple images found, process each one
              console.log(chalk.yellow(`📸 Processing ${base64DataArray.length} images from URL...`));
              for (let i = 0; i < base64DataArray.length; i++) {
                const currentOutput = options.output ? 
                  `${options.output.replace(/\.[^/.]+$/, '')}_${i + 1}` : 
                  `converted_image_${Date.now()}_${i + 1}`;
                
                if (options.outputdir) {
                  const dir = options.outputdir || process.cwd();
                  const filename = currentOutput.split('/').pop();
                  const finalOutput = `${dir}/${filename}`;
                  await convertBase64ToImage(base64DataArray[i], finalOutput);
                } else {
                  await convertBase64ToImage(base64DataArray[i], currentOutput);
                }
              }
              return; // Exit early since we processed multiple images
            }
          } else if (options.file) {
            try {
              base64Data = await fs.readFile(options.file, 'utf8');
              console.log(chalk.blue(`📁 Reading base64 data from: ${options.file}`));
            } catch (error) {
              console.error(chalk.red(`❌ Error reading file: ${error.message}`));
              process.exit(1);
            }
          } else {
            console.error(chalk.red('❌ Error: Please provide base64 data as argument or use --url/--file option'));
            process.exit(1);
          }
        }
      
      // Remove whitespace and newlines
      base64Data = base64Data.trim().replace(/\s/g, '');
      
      if (!base64Data) {
        console.error(chalk.red('❌ Error: Empty base64 data provided'));
        process.exit(1);
      }
      
      await convertBase64ToImage(base64Data, options.output);
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
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
          console.error(chalk.red('❌ Error: Please provide base64 data as argument or use --file option'));
          process.exit(1);
        }
        
        try {
          base64Data = await fs.readFile(options.file, 'utf8');
          console.log(chalk.blue(`📁 Reading base64 data from: ${options.file}`));
        } catch (error) {
          console.error(chalk.red(`❌ Error reading file: ${error.message}`));
          process.exit(1);
        }
      }
      
      base64Data = base64Data.trim().replace(/\s/g, '');
      
      if (!base64Data) {
        console.error(chalk.red('❌ Error: Empty base64 data provided'));
        process.exit(1);
      }
      
      const mimeType = detectImageType(base64Data);
      if (mimeType) {
        const extension = mimeToExtension[mimeType];
        console.log(chalk.green(`🔍 Detected image type: ${mimeType}`));
        console.log(chalk.blue(`📄 File extension: ${extension || 'unknown'}`));
        
        const rawBase64 = extractBase64Data(base64Data);
        const buffer = Buffer.from(rawBase64, 'base64');
        console.log(chalk.blue(`📊 Estimated file size: ${(buffer.length / 1024).toFixed(2)} KB`));
      } else {
        console.log(chalk.yellow('❓ Could not detect image type from the provided data'));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
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
        console.log(chalk.blue(`📁 Reading base64 data from: DATA`));
              } catch (err) {
          console.error(chalk.red('❌ Error: No arguments provided and no DATA file found in current directory.'));
          console.error(chalk.yellow('Usage: ./b64ic [data] [options] or ./b64ic -f <file> [options] or ./b64ic -u <url> [options] or ./b64ic [options] (with DATA file)'));
          process.exit(1);
        }
      
      // Remove whitespace and newlines
      base64Data = base64Data.trim().replace(/\s/g, '');
      if (!base64Data) {
        console.error(chalk.red('❌ Error: Empty base64 data in DATA file'));
        process.exit(1);
      }
      
      // Use default output path
      const outputOption = process.cwd() + '/image_' + Date.now();
      await convertBase64ToImage(base64Data, outputOption);
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  })();
} else if (process.argv.length > 2 && (process.argv[2].startsWith('-') || !['convert', 'detect'].includes(process.argv[2]))) {
  // Check if it's a help or version request
  if (process.argv[2] === '-h' || process.argv[2] === '--help') {
    program.help();
  }
  if (process.argv[2] === '-V' || process.argv[2] === '--version') {
    program.version();
  }
  
  // Improved argument parsing for default mode
  let data = null;
  let fileOption = null;
  let urlOption = null;
  let outputOption = null;
  let outputDir = null;

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '-f' || arg === '--file') {
      fileOption = process.argv[i + 1];
      i++;
    } else if (arg === '-u' || arg === '--url') {
      urlOption = process.argv[i + 1];
      i++;
    } else if (arg === '-o' || arg === '--output') {
      outputOption = process.argv[i + 1];
      i++;
    } else if (arg === '-d' || arg === '--outputdir') {
      outputDir = process.argv[i + 1];
      i++;
    } else if (!arg.startsWith('-') && data === null) {
      data = arg;
    }
  }

  (async () => {
    try {
      let base64Data = data;
      // If no data is provided, try URL option first, then file option, then DATA file
      if (!base64Data) {
        if (urlOption) {
          const base64DataArray = await fetchAndScanUrl(urlOption);
          if (base64DataArray.length === 1) {
            base64Data = base64DataArray[0];
          } else {
            // Multiple images found, process each one
            console.log(chalk.yellow(`📸 Processing ${base64DataArray.length} images from URL...`));
            for (let i = 0; i < base64DataArray.length; i++) {
              const currentOutput = outputOption ? 
                `${outputOption.replace(/\.[^/.]+$/, '')}_${i + 1}` : 
                `${process.cwd()}/image_${Date.now()}_${i + 1}`;
              
              if (outputDir) {
                const dir = outputDir || process.cwd();
                const filename = currentOutput.split('/').pop();
                const finalOutput = `${dir}/${filename}`;
                await convertBase64ToImage(base64DataArray[i], finalOutput);
              } else {
                await convertBase64ToImage(base64DataArray[i], currentOutput);
              }
            }
            return; // Exit early since we processed multiple images
          }
        } else if (fileOption) {
          const fileContent = await fs.readFile(fileOption, 'utf8');
          console.log(chalk.blue(`📁 Reading base64 data from: ${fileOption}`));
          
          // Check if it's HTML content
          if (fileContent.trim().toLowerCase().startsWith('<!doctype') || fileContent.includes('<html')) {
            console.log(chalk.yellow('📄 Detected HTML content, performing enhanced scan...'));
            const base64DataArray = scanHtmlForBase64Data(fileContent);
            if (base64DataArray.length === 1) {
              base64Data = base64DataArray[0];
            } else if (base64DataArray.length > 1) {
              // Multiple images found, process each one
              console.log(chalk.yellow(`📸 Processing ${base64DataArray.length} images from HTML file...`));
              for (let i = 0; i < base64DataArray.length; i++) {
                const currentOutput = outputOption ? 
                  `${outputOption.replace(/\.[^/.]+$/, '')}_${i + 1}` : 
                  `${process.cwd()}/image_${Date.now()}_${i + 1}`;
                
                if (outputDir) {
                  const dir = outputDir || process.cwd();
                  const filename = currentOutput.split('/').pop();
                  const finalOutput = `${dir}/${filename}`;
                  await convertBase64ToImage(base64DataArray[i], finalOutput);
                } else {
                  await convertBase64ToImage(base64DataArray[i], currentOutput);
                }
              }
              return; // Exit early since we processed multiple images
            } else {
              throw new Error('No base64 image data found in the HTML file');
            }
          } else {
            // Not HTML, use standard scanning
            const base64DataArray = scanForBase64Data(fileContent);
            if (base64DataArray.length === 1) {
              base64Data = base64DataArray[0];
            } else if (base64DataArray.length > 1) {
              // Multiple images found, process each one
              console.log(chalk.yellow(`📸 Processing ${base64DataArray.length} images from file...`));
              for (let i = 0; i < base64DataArray.length; i++) {
                const currentOutput = outputOption ? 
                  `${outputOption.replace(/\.[^/.]+$/, '')}_${i + 1}` : 
                  `${process.cwd()}/image_${Date.now()}_${i + 1}`;
                
                if (outputDir) {
                  const dir = outputDir || process.cwd();
                  const filename = currentOutput.split('/').pop();
                  const finalOutput = `${dir}/${filename}`;
                  await convertBase64ToImage(base64DataArray[i], finalOutput);
                } else {
                  await convertBase64ToImage(base64DataArray[i], currentOutput);
                }
              }
              return; // Exit early since we processed multiple images
            } else {
              base64Data = fileContent;
            }
          }
        } else {
            // Look for a file called DATA in the current directory
            try {
              base64Data = await fs.readFile('DATA', 'utf8');
              console.log(chalk.blue(`📁 Reading base64 data from: DATA`));
            } catch (err) {
              console.error(chalk.red('❌ Error: No base64 data provided, no URL/file path given, and no DATA file found in current directory.'));
              process.exit(1);
            }
          }
        }
      // Remove whitespace and newlines
      base64Data = base64Data.trim().replace(/\s/g, '');
      if (!base64Data) {
        console.error(chalk.red('❌ Error: Empty base64 data provided'));
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
      console.error(chalk.red(`❌ Error: ${error.message}`));
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