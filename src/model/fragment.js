const { randomUUID } = require('crypto');
const contentType = require('content-type');
const sharp = require('sharp');
const yaml = require('js-yaml');

const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId || !type) {
      throw new Error('ownerId and type are required');
    }

    if (typeof size !== 'number' || size < 0) {
      throw new Error('size must be a non-negative number');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;

    if (!Fragment.isSupportedType(this.type)) {
      throw new Error(`Unsupported type: ${this.type}`);
    }
  }

  static async byUser(ownerId, expand = false) {
    return listFragments(ownerId, expand);
  }

  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);
    if (!fragment) {
      throw new Error('Fragment not found');
    }
    return new Fragment(fragment);
  }

  static async delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  async save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  async getData(extension = null) {
    const data = await readFragmentData(this.ownerId, this.id);

    if (extension === 'html' && this.type === 'text/markdown') {
      const markdownIt = require('markdown-it')();
      return Buffer.from(markdownIt.render(data.toString()));
    }

    if (extension && !this.formats.includes(extension)) {
      throw new Error('Unsupported extension');
    }

    return data;
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer');
    }
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save();
  }

  async convertTo(extension) {
    const data = await readFragmentData(this.ownerId, this.id);

    switch (extension) {
      case 'txt':
        return this.convertToText(data);
      case 'html':
        if (this.type === 'text/markdown') {
          const markdownIt = require('markdown-it')();
          return Buffer.from(markdownIt.render(data.toString()));
        }
        if (this.type === 'text/html') {
          return data;
        }
        throw new Error('Unsupported conversion');
      case 'md':
        if (this.type === 'text/markdown') {
          return data; // markdown is already in .md format
        }
        throw new Error('Unsupported conversion');
      case 'json':
        if (this.type === 'text/csv') {
          return this.convertCsvToJson(data.toString());
        }
        throw new Error('Unsupported conversion');
      case 'yaml':
      case 'yml':
        if (this.type === 'application/json') {
          return this.convertJsonToYaml(data.toString());
        }
        throw new Error('Unsupported conversion');
      case 'png':
      case 'jpg':
      case 'webp':
      case 'gif':
      case 'avif':
        if (this.mimeType.startsWith('image/')) {
          return this.convertImage(data, extension);
        }
        throw new Error('Unsupported conversion');
      default:
        throw new Error('Unsupported extension');
    }
  }

  convertToText(data) {
    return data; // Just return the buffer as it is for text/plain conversions
  }

  convertCsvToJson(csvData) {
    const csv = require('csvtojson');

    // Convert CSV string to JSON
    return csv()
      .fromString(csvData)
      .then((jsonObj) => Buffer.from(JSON.stringify(jsonObj, null, 2)))
      .catch((error) => {
        throw new Error(`CSV to JSON conversion failed: ${error.message}`);
      });
  }

  convertJsonToYaml(jsonData) {
    const jsonObject = JSON.parse(jsonData);
    return Buffer.from(yaml.dump(jsonObject));
  }

  async convertImage(data, extension) {
    try {
      const image = sharp(data);
      switch (extension) {
        case 'png':
          return await image.png().toBuffer();
        case 'jpg':
        case 'jpeg':
          return await image.jpeg().toBuffer();
        case 'webp':
          return await image.webp().toBuffer();
        case 'gif':
          return await image.gif().toBuffer();
        case 'avif':
          return await image.avif().toBuffer();
        default:
          throw new Error('Unsupported image conversion');
      }
    } catch (error) {
      throw new Error(`Image conversion failed: ${error.message}`);
    }
  }

  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  get isText() {
    return this.mimeType.startsWith('text/');
  }

  get formats() {
    switch (this.mimeType) {
      case 'text/plain':
        return ['text/plain'];
      case 'text/markdown':
        return ['md', 'html', 'txt'];
      case 'text/html':
        return ['html', 'txt'];
      case 'text/csv':
        return ['csv', 'txt', 'json'];
      case 'application/json':
        return ['json', 'yaml', 'yml', 'txt'];
      case 'application/yaml':
        return ['yaml', 'yml', 'txt'];
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/avif':
      case 'image/gif':
        return ['png', 'jpg', 'webp', 'gif', 'avif'];
      default:
        return [];
    }
  }

  getMimeType(extension) {
    const mimeTypes = {
      html: 'text/html',
      txt: 'text/plain',
      md: 'text/markdown',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      avif: 'image/avif',
      csv: 'text/csv',
      json: 'application/json',
      yaml: 'application/yaml',
      yml: 'application/yaml',
    };
    return mimeTypes[extension] || this.mimeType;
  }

  static isSupportedType(value) {
    const { type } = contentType.parse(value);
    return [
      'text/plain',
      'text/plain; charset=utf-8',
      'text/markdown',
      'text/html',
      'text/csv',
      'application/json',
      'application/yaml',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
    ].includes(type);
  }
}

module.exports.Fragment = Fragment;
