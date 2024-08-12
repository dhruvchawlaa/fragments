const { Fragment } = require('../../src/model/fragment');

// Mock the sharp module for image conversions
jest.mock('sharp');
const sharp = require('sharp');
sharp.mockReturnValue({
  png: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  gif: jest.fn().mockReturnThis(),
  avif: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('converted-image')),
});

describe('Fragment class - convertTo method', () => {
  describe('text conversions', () => {
    test('converts Markdown to HTML', async () => {
      const markdown = Buffer.from('# Hello World');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(markdown);

      const htmlData = await fragment.convertTo('html');
      expect(htmlData.toString()).toBe('<h1>Hello World</h1>\n');
    });

    test('returns Markdown as is when converting to .md', async () => {
      const markdown = Buffer.from('# Hello World');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(markdown);

      const mdData = await fragment.convertTo('md');
      expect(mdData.toString()).toBe('# Hello World');
    });

    test('converts CSV to JSON', async () => {
      const csv = Buffer.from('name,age\nJohn Doe,30\nJane Doe,25');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/csv', size: 0 });
      await fragment.save();
      await fragment.setData(csv);

      const jsonData = await fragment.convertTo('json');
      expect(JSON.parse(jsonData.toString())).toEqual([
        { name: 'John Doe', age: '30' },
        { name: 'Jane Doe', age: '25' },
      ]);
    });

    test('converts JSON to YAML', async () => {
      const json = Buffer.from(JSON.stringify({ name: 'John Doe', age: 30 }));
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      await fragment.save();
      await fragment.setData(json);

      const yamlData = await fragment.convertTo('yaml');
      expect(yamlData.toString()).toBe('name: John Doe\nage: 30\n');
    });

    test('returns plain text as is when converting to .txt', async () => {
      const text = Buffer.from('Hello, World!');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(text);

      const txtData = await fragment.convertTo('txt');
      expect(txtData.toString()).toBe('Hello, World!');
    });
  });

  describe('image conversions', () => {
    test('converts PNG to JPEG', async () => {
      const pngData = Buffer.from('fake-png-data');
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      await fragment.save();
      await fragment.setData(pngData);

      const jpegData = await fragment.convertTo('jpg');
      expect(sharp).toHaveBeenCalledWith(pngData);
      expect(jpegData.toString()).toBe('converted-image');
    });

    test('converts JPEG to WebP', async () => {
      const jpegData = Buffer.from('fake-jpeg-data');
      const fragment = new Fragment({ ownerId: '1234', type: 'image/jpeg', size: 0 });
      await fragment.save();
      await fragment.setData(jpegData);

      const webpData = await fragment.convertTo('webp');
      expect(sharp).toHaveBeenCalledWith(jpegData);
      expect(webpData.toString()).toBe('converted-image');
    });

    test('converts WebP to GIF', async () => {
      const webpData = Buffer.from('fake-webp-data');
      const fragment = new Fragment({ ownerId: '1234', type: 'image/webp', size: 0 });
      await fragment.save();
      await fragment.setData(webpData);

      const gifData = await fragment.convertTo('gif');
      expect(sharp).toHaveBeenCalledWith(webpData);
      expect(gifData.toString()).toBe('converted-image');
    });

    test('throws error for unsupported image conversion', async () => {
      const pngData = Buffer.from('fake-png-data');
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      await fragment.save();
      await fragment.setData(pngData);

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });
  });

  describe('error handling', () => {
    test('throws error for unsupported text conversion', async () => {
      const markdown = Buffer.from('# Hello World');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(markdown);

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('throws error when trying to convert to an unsupported extension', async () => {
      const data = Buffer.from('supported data');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });
  });

  describe('Fragment class - additional test cases for coverage', () => {
    test('getData throws error for unsupported extension', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# Hello World'));

      await expect(fragment.getData('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('setData throws error when data is not a Buffer', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();

      await expect(fragment.setData('not a buffer')).rejects.toThrow('Data must be a Buffer');
    });

    test('convertTo throws error for unsupported conversion', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# Hello World'));

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('convertImage throws error for unsupported image conversion', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('fake image data'));

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('formats returns empty array for unsupported MIME type', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });

      // Manually override the type to simulate an unsupported MIME type
      fragment.type = 'application/octet-stream';

      expect(fragment.formats).toEqual([]);
    });

    test('getMimeType returns correct MIME type for known extension', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      expect(fragment.getMimeType('html')).toBe('text/html');
      expect(fragment.getMimeType('txt')).toBe('text/plain');
    });

    test('getMimeType returns original MIME type if extension is unknown', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      expect(fragment.getMimeType('unknown')).toBe('application/json');
    });

    test('getData throws error when extension is not supported', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('Simple text'));

      await expect(fragment.getData('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('setData throws error when data is not a Buffer', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();

      await expect(fragment.setData('not a buffer')).rejects.toThrow('Data must be a Buffer');
    });

    test('convertTo throws error for unsupported extension', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('Simple text'));

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('convertImage throws an error when sharp conversion fails', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('fake image data'));

      // Mock sharp to throw an error
      sharp.mockReturnValueOnce({
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('Sharp conversion failed')),
      });

      await expect(fragment.convertTo('png')).rejects.toThrow(
        'Image conversion failed: Sharp conversion failed'
      );
    });

    test('formats returns empty array for unsupported MIME type', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      fragment.type = 'application/octet-stream';

      expect(fragment.formats).toEqual([]);
    });

    test('convertImage throws error for unsupported image conversion', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('fake image data'));

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('getMimeType returns correct MIME type for known and unknown extensions', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });

      expect(fragment.getMimeType('json')).toBe('application/json');
      expect(fragment.getMimeType('yaml')).toBe('application/yaml');
      expect(fragment.getMimeType('unknown')).toBe('application/json');
    });

    test('convertTo throws error for unsupported conversion from HTML to unsupported format', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/html', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('<p>Hello World</p>'));

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('convertTo throws error when trying to convert from markdown to unsupported format', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# Hello World'));

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('convertTo throws error for unsupported conversion from CSV to unsupported format', async () => {
      const csvData = Buffer.from('name,age\nJohn Doe,30\nJane Doe,25');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/csv', size: 0 });
      await fragment.save();
      await fragment.setData(csvData);

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('convertImage throws error for unsupported image format conversion', async () => {
      const pngData = Buffer.from('fake-png-data');
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      await fragment.save();
      await fragment.setData(pngData);

      await expect(fragment.convertTo('unsupported')).rejects.toThrow('Unsupported extension');
    });

    test('formats returns correct supported formats for various MIME types', () => {
      const fragment1 = new Fragment({ ownerId: '1234', type: 'text/csv', size: 0 });
      expect(fragment1.formats).toEqual(['csv', 'txt', 'json']);

      const fragment2 = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      expect(fragment2.formats).toEqual(['json', 'yaml', 'yml', 'txt']);

      const fragment3 = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      expect(fragment3.formats).toEqual(['png', 'jpg', 'webp', 'gif', 'avif']);
    });
  });
});
