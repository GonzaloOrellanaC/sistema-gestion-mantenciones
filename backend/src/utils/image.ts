import sharp from 'sharp';

export async function generateThumbnail(inputPath: string, outputPath: string, width = 300) {
  // use sharp to resize and optimize
  await sharp(inputPath).resize({ width }).jpeg({ quality: 75 }).toFile(outputPath);
}

export default { generateThumbnail };
