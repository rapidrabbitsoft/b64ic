#!/usr/bin/env node

import fs from 'fs/promises';
import { execSync } from 'child_process';

// Sample base64 data for testing
const testData = {
  png: {
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    raw: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    description: '1x1 transparent PNG'
  },
  jpeg: {
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
    raw: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
    description: '1x1 JPEG'
  }
};

async function runTest(testName, command) {
  console.log(`\n🧪 Running test: ${testName}`);
  console.log(`📝 Command: ${command}`);
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(`✅ Test passed!`);
    console.log(`📤 Output:\n${output}`);
    return true;
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
}

async function createTestFiles() {
  console.log('📁 Creating test files...');
  
  // Create test files with base64 data
  await fs.writeFile('test_png_data.txt', testData.png.dataUrl);
  await fs.writeFile('test_jpeg_data.txt', testData.jpeg.dataUrl);
  await fs.writeFile('test_raw_png.txt', testData.png.raw);
  
  console.log('✅ Test files created successfully!');
}

async function cleanupTestFiles() {
  console.log('\n🧹 Cleaning up test files...');
  
  const filesToDelete = [
    'test_png_data.txt',
    'test_jpeg_data.txt', 
    'test_raw_png.txt',
    'converted_image_*.png',
    'converted_image_*.jpg',
    'test_output.png',
    'test_output.jpg'
  ];
  
  for (const pattern of filesToDelete) {
    try {
      const files = await fs.readdir('.');
      const matchingFiles = files.filter(file => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(file);
        }
        return file === pattern;
      });
      
      for (const file of matchingFiles) {
        await fs.unlink(file);
        console.log(`🗑️  Deleted: ${file}`);
      }
    } catch (error) {
      // File doesn't exist, that's fine
    }
  }
  
  console.log('✅ Cleanup completed!');
}

async function runAllTests() {
  console.log('🚀 Starting Base64 Image Converter CLI Tests\n');
  
  // Create test files
  await createTestFiles();
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Help command
  totalTests++;
  if (await runTest('Help Command', 'node index.js --help')) passedTests++;
  
  // Test 2: Detect PNG from data URL
  totalTests++;
  if (await runTest('Detect PNG from Data URL', `node index.js detect "${testData.png.dataUrl}"`)) passedTests++;
  
  // Test 3: Detect JPEG from data URL
  totalTests++;
  if (await runTest('Detect JPEG from Data URL', `node index.js detect "${testData.jpeg.dataUrl}"`)) passedTests++;
  
  // Test 4: Detect PNG from file
  totalTests++;
  if (await runTest('Detect PNG from File', 'node index.js detect -f test_png_data.txt')) passedTests++;
  
  // Test 5: Convert PNG from data URL
  totalTests++;
  if (await runTest('Convert PNG from Data URL', `node index.js convert "${testData.png.dataUrl}"`)) passedTests++;
  
  // Test 6: Convert JPEG from data URL with custom output
  totalTests++;
  if (await runTest('Convert JPEG with Custom Output', `node index.js convert "${testData.jpeg.dataUrl}" -o test_output.jpg`)) passedTests++;
  
  // Test 7: Convert PNG from file
  totalTests++;
  if (await runTest('Convert PNG from File', 'node index.js convert -f test_png_data.txt -o test_output.png')) passedTests++;
  
  // Test 8: Convert raw base64 PNG
  totalTests++;
  if (await runTest('Convert Raw Base64 PNG', 'node index.js convert -f test_raw_png.txt')) passedTests++;
  
  // Test 9: Error handling - invalid data (expected to fail with proper error)
  totalTests++;
  const invalidDataResult = await runTest('Error Handling - Invalid Data', 'node index.js convert "invalid_base64_data"');
  if (!invalidDataResult) passedTests++; // This test should fail, so we count it as passed if it fails
  
  // Test 10: Error handling - missing input (expected to fail with proper error)
  totalTests++;
  const missingInputResult = await runTest('Error Handling - Missing Input', 'node index.js convert');
  if (!missingInputResult) passedTests++; // This test should fail, so we count it as passed if it fails
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Cleanup
  await cleanupTestFiles();
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The CLI tool is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
} 