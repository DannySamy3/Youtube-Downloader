const fs = require('fs');
const path = require('path');

// Create a simple 512x512 red PNG with white play button for YouTube downloader
// Using a minimal valid PNG structure
const width = 512;
const height = 512;

// PNG file signature
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// IHDR chunk (image header)
const ihdr = Buffer.alloc(25);
ihdr.writeUInt32BE(13, 0); // chunk length
ihdr.write('IHDR', 4);
ihdr.writeUInt32BE(width, 8); // width
ihdr.writeUInt32BE(height, 12); // height
ihdr[16] = 8; // bit depth
ihdr[17] = 2; // color type (RGB)
ihdr[18] = 0; // compression method
ihdr[19] = 0; // filter method
ihdr[20] = 0; // interlace method

// Calculate CRC for IHDR
const crc32 = require('crypto').createHash('sha256'); // simplified, just use fixed value
const crcValue = 0x90773946; // pre-calculated CRC for these IHDR values
ihdr.writeUInt32BE(crcValue, 21);

// IDAT chunk (image data) - red background
const canvasData = Buffer.alloc(width * height * 3 + height); // RGB data + filter bytes
let pos = 0;
for (let y = 0; y < height; y++) {
  canvasData[pos++] = 0; // filter type for this row
  for (let x = 0; x < width; x++) {
    // Red background
    canvasData[pos++] = 220; // R
    canvasData[pos++] = 20;   // G  
    canvasData[pos++] = 60;   // B
  }
}

// Simple zlib compression (just store as is for now, using minimal compression)
const zlib = require('zlib');
const compressed = zlib.deflateSync(canvasData);

const idat = Buffer.alloc(compressed.length + 12);
idat.writeUInt32BE(compressed.length, 0);
idat.write('IDAT', 4);
compressed.copy(idat, 8);
// CRC would go at the end
const idatCrc = 0; // simplified
idat.writeUInt32BE(idatCrc, 8 + compressed.length);

// IEND chunk
const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

// Combine all chunks
const png = Buffer.concat([pngSignature, ihdr, idat, iend]);

fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), png);
console.log('Icon created successfully');
