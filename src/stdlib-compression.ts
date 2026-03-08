/**
 * FreeLang v2 - compression 네이티브 함수
 *
 * Express response compression middleware
 * gzip, deflate, brotli 압축 지원
 */

import { NativeFunctionRegistry } from './vm/native-function-registry';
import * as zlib from 'zlib';

/**
 * Compression 함수 등록
 */
export function registerCompressionFunctions(registry: NativeFunctionRegistry): void {
  // compression_gzip_compress(data, level) -> string
  // gzip 압축 (level 0-9)
  registry.register({
    name: 'compression_gzip_compress',
    module: 'compression',
    executor: (args) => {
      const data = String(args[0]);
      const level = parseInt(String(args[1] || 6));

      try {
        const buffer = Buffer.from(data, 'utf-8');
        const compressed = zlib.gzipSync(buffer, { level: Math.min(9, Math.max(0, level)) });
        return compressed.toString('base64');
      } catch (error: any) {
        console.error(`[compression] gzip failed: ${error.message}`);
        return data; // 압축 실패 시 원본 반환
      }
    }
  });

  // compression_deflate_compress(data, level) -> string
  // deflate 압축 (level 0-9)
  registry.register({
    name: 'compression_deflate_compress',
    module: 'compression',
    executor: (args) => {
      const data = String(args[0]);
      const level = parseInt(String(args[1] || 6));

      try {
        const buffer = Buffer.from(data, 'utf-8');
        const compressed = zlib.deflateSync(buffer, { level: Math.min(9, Math.max(0, level)) });
        return compressed.toString('base64');
      } catch (error: any) {
        console.error(`[compression] deflate failed: ${error.message}`);
        return data; // 압축 실패 시 원본 반환
      }
    }
  });

  // compression_brotli_compress(data, level) -> string
  // brotli 압축 (level 0-11)
  registry.register({
    name: 'compression_brotli_compress',
    module: 'compression',
    executor: (args) => {
      const data = String(args[0]);
      const level = parseInt(String(args[1] || 11));

      try {
        const buffer = Buffer.from(data, 'utf-8');
        const compressed = zlib.brotliCompressSync(buffer, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: Math.min(11, Math.max(0, level))
          }
        });
        return compressed.toString('base64');
      } catch (error: any) {
        console.error(`[compression] brotli failed: ${error.message}`);
        return data; // 압축 실패 시 원본 반환
      }
    }
  });

  // compression_gzip_decompress(data) -> string
  // gzip 압축 해제
  registry.register({
    name: 'compression_gzip_decompress',
    module: 'compression',
    executor: (args) => {
      const data = String(args[0]);

      try {
        const buffer = Buffer.from(data, 'base64');
        const decompressed = zlib.gunzipSync(buffer);
        return decompressed.toString('utf-8');
      } catch (error: any) {
        console.error(`[compression] gzip decompress failed: ${error.message}`);
        return '';
      }
    }
  });

  // compression_deflate_decompress(data) -> string
  // deflate 압축 해제
  registry.register({
    name: 'compression_deflate_decompress',
    module: 'compression',
    executor: (args) => {
      const data = String(args[0]);

      try {
        const buffer = Buffer.from(data, 'base64');
        const decompressed = zlib.inflateSync(buffer);
        return decompressed.toString('utf-8');
      } catch (error: any) {
        console.error(`[compression] deflate decompress failed: ${error.message}`);
        return '';
      }
    }
  });

  // compression_brotli_decompress(data) -> string
  // brotli 압축 해제
  registry.register({
    name: 'compression_brotli_decompress',
    module: 'compression',
    executor: (args) => {
      const data = String(args[0]);

      try {
        const buffer = Buffer.from(data, 'base64');
        const decompressed = zlib.brotliDecompressSync(buffer);
        return decompressed.toString('utf-8');
      } catch (error: any) {
        console.error(`[compression] brotli decompress failed: ${error.message}`);
        return '';
      }
    }
  });

  // compression_estimate_compressed_size(data, encoding) -> int
  // 압축 후 예상 크기 반환 (최적화용)
  registry.register({
    name: 'compression_estimate_compressed_size',
    module: 'compression',
    executor: (args) => {
      const data = String(args[0]);
      const encoding = String(args[1] || 'gzip');

      try {
        const buffer = Buffer.from(data, 'utf-8');
        let compressed: Buffer;

        if (encoding === 'gzip') {
          compressed = zlib.gzipSync(buffer, { level: 6 });
        } else if (encoding === 'deflate') {
          compressed = zlib.deflateSync(buffer, { level: 6 });
        } else if (encoding === 'br' || encoding === 'brotli') {
          compressed = zlib.brotliCompressSync(buffer, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11
            }
          });
        } else {
          return buffer.length;
        }

        return compressed.length;
      } catch (error: any) {
        console.error(`[compression] estimate failed: ${error.message}`);
        return String(args[0]).length;
      }
    }
  });

  // compression_ratio(original, compressed) -> float
  // 압축률 계산 (0.0-1.0)
  registry.register({
    name: 'compression_ratio',
    module: 'compression',
    executor: (args) => {
      const originalSize = parseInt(String(args[0]));
      const compressedSize = parseInt(String(args[1]));

      if (originalSize === 0) return 0.0;
      return compressedSize / originalSize;
    }
  });
}
