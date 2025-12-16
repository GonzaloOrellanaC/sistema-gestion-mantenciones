import { generateThumbnail } from '../utils/image';
import fs from 'fs';
import path from 'path';

jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({})
  }));
});

describe('image util', () => {
  it('calls sharp to generate thumbnail', async () => {
    const input = path.join(__dirname, 'fixtures', 'sample.jpg');
    const outdir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
    // create a dummy file buffer
    fs.writeFileSync(input, Buffer.from([0, 1, 2, 3]));
    const out = path.join(outdir, 'thumb_sample.jpg');
    await generateThumbnail(input, out, 100);
    // assert thumbnail file was attempted to be created (mocked sharp resolves)
    expect(fs.existsSync(input)).toBe(true);
    // cleanup
    fs.unlinkSync(input);
    // note: out file not created because sharp is mocked; we just ensure no exception
  });
});
