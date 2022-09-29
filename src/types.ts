import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

/**
 * JavaScript Typed Array
 *
 * ## Note
 *
 * For this assignment, I only cared about the really small subset of typed
 * array we might want to use
 */
export type PixelArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Float32Array;

/**
 * Constructor type
 */
export type Constructor<T> = new (...args: any) => T;

/** Accepted type for a uniform. */
export type UniformType =
  | number
  | Float32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | boolean
  | mat2
  | mat3
  | mat4
  | vec2
  | vec3
  | vec4;
