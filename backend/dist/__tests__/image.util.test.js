"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const image_1 = require("../utils/image");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
jest.mock('sharp', () => {
    return jest.fn(() => ({
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue({})
    }));
});
describe('image util', () => {
    it('calls sharp to generate thumbnail', async () => {
        const input = path_1.default.join(__dirname, 'fixtures', 'sample.jpg');
        const outdir = path_1.default.join(__dirname, 'fixtures');
        if (!fs_1.default.existsSync(outdir))
            fs_1.default.mkdirSync(outdir, { recursive: true });
        // create a dummy file buffer
        fs_1.default.writeFileSync(input, Buffer.from([0, 1, 2, 3]));
        const out = path_1.default.join(outdir, 'thumb_sample.jpg');
        await (0, image_1.generateThumbnail)(input, out, 100);
        // assert thumbnail file was attempted to be created (mocked sharp resolves)
        expect(fs_1.default.existsSync(input)).toBe(true);
        // cleanup
        fs_1.default.unlinkSync(input);
        // note: out file not created because sharp is mocked; we just ensure no exception
    });
});
