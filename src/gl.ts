import { Geometry } from './geometries/geometry';
import { Shader } from './shader/shader';
import { Texture, Texture2D } from './textures/texture';
import { PixelArray, UniformType } from './types';

/**
 * Wrapper on a WebGL2RenderingContext. This hold the entire WebGL context, its
 * current state, and some data.
 *
 * This file is used to simplify resource management, and to simplify the
 * process of sending draw calls to WebGL.
 *
 * ## Note
 *
 * This abstraction if **far** from perfect. Making a really good abstraction
 * is anyway not the subject here, and would be a really time consuming job.
 * A lot of errors aren't handled, and some corner cases are clearly not
 * handled.
 *
 * However, it's robust enough to handle a lot of uniforms, textures, and
 * state changes.
 *
 * ## Advice
 *
 * I advise you to not spend too much time trying to figure out at first exactly
 * what that does. You should first finish the assignment.
 *
 * When you are done with the assignment, you can go over this file to
 * understand how I abstracted WebGL to simplify the usage. I am not saying
 * that this wrapper is perfect. However, for the use case of this project,
 * it does a pretty good job without going over ~200 lines.
 */
export class GLContext {
  /** Inner WebGL context */
  private _gl: WebGL2RenderingContext;

  /**
   * Cache for geometries. This cache allows us to retrieve the GL object
   * associated to an instance of [[Geometry]] (our class).
   *
   * @private
   */
  private _geometries: WeakMap<Geometry, GeometryCache>;

  /**
   * Cache for textures. This cache allows us to retrieve the GL object
   * associated to an instance of [[Texture]] (our class)
   *
   * @private
   */
  private _textures: WeakMap<Texture, TextureCache>;

  /**
   * Cache for programs. This cache allows us to retrieve the GL object
   * associated to an instance of [[Texture]] (our class)
   *
   * @private
   */
  private _programs: WeakMap<Shader, ProgramCache | null>;

  /**
   * Currently bound texture unit slot.
   *
   * @private
   */
  private _textureUnitSlot: number;

  public constructor(canvas: HTMLCanvasElement) {
    this._gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    this._gl.clearColor(0.1, 0.1, 0.1, 1.0);

    this._geometries = new WeakMap();
    this._textures = new WeakMap();
    this._programs = new WeakMap();

    this._textureUnitSlot = 0;

    this.resize();
  }

  /**
   * Resizes the GL viewport to match the main framebuffer size
   */
  public resize(): void {
    const gl = this._gl;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  /**
   * Sets the GL culling.
   *
   * @param type - GL culling parameter. Using `null` will disable culling.
   *
   * @return This instance, for chaining
   */
  public setCulling(type: number | null): this {
    const gl = this._gl;
    // @note: clearly unoptimized. Enabling / disabling culling just to change
    // the culling type is useless.
    if (type == null) {
      gl.disable(gl.CULL_FACE);
    } else {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(type);
    }
    return this;
  }

  /**
   * Enables / Disables depth testing.
   *
   * @param flag - If `true`, depth testing will be enabled.
   *
   * @return This instance, for chaining
   */
  public setDepthTest(flag: boolean): this {
    const gl = this._gl;
    if (flag) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
    return this;
  }

  /**
   * Compiles a given [[Shader]] instance.
   *
   * ## Note
   *
   * Errors will be reported in the console.
   *
   * @param shader - The [[Shader]] instancce to compile
   *
   * @return This instance, for chaining
   */
  public compileProgram(shader: Shader): this {
    const gl = this._gl;
    const cache = this._programs.get(shader);
    if (cache) {
      gl.deleteShader(cache.vertexObjectGL);
      gl.deleteShader(cache.fragmentObjectGL);
      gl.deleteProgram(cache.programObjectGL);
    }

    const vxSource = preprocessShader(shader.vertexSource, shader.defines);
    const fgSource = preprocessShader(shader.fragmentSource, shader.defines);

    let programObjectGL = null;
    const vertexObjectGL = compileShader(gl, gl.VERTEX_SHADER, vxSource);
    const fragmentObjectGL = compileShader(gl, gl.FRAGMENT_SHADER, fgSource);
    if (!!vertexObjectGL && !!fragmentObjectGL) {
      programObjectGL = compileProgram(gl, vertexObjectGL!, fragmentObjectGL!);
    }

    if (programObjectGL === null) {
      if (vertexObjectGL) {
        gl.deleteShader(vertexObjectGL);
      }
      if (fragmentObjectGL) {
        gl.deleteShader(fragmentObjectGL);
      }
      this._programs.set(shader, null);
      return this;
    }

    const uniformLocationLUT = getActiveUniformsInfo(gl, programObjectGL);

    this._programs.set(shader, {
      vertexObjectGL,
      fragmentObjectGL,
      programObjectGL,
      uniformLocationLUT,
      vaoList: new Map()
    });

    return this;
  }

  /**
   * Uploads a geometry to the GPU.
   *
   * ## Note
   *
   * Geometry are represented as a set of Vertex Buffer Object (VBO), For each
   * shader, a VAO is created for the geometry.
   *
   * @param geometry - The [[Geometry]] instance to upload
   */
  public uploadGeometry(geometry: Geometry) {
    const gl = this._gl;
    if (!this._geometries.has(geometry)) {
      // Note: we are missing `null` check here.
      const cache = {
        positionBuffer: this._gl.createBuffer(),
        normalBuffer: this._gl.createBuffer(),
        uvBuffer: geometry.uvs != null ? this._gl.createBuffer() : null,
        indexBuffer: this._gl.createBuffer()
      } as GeometryCache;
      this._geometries.set(geometry, cache);
    }
    const cache = this._geometries.get(geometry)!;
    switch (geometry.indices.BYTES_PER_ELEMENT) {
      case 1:
        cache.indexType = gl.UNSIGNED_BYTE;
        break;
      case 2:
        cache.indexType = gl.UNSIGNED_SHORT;
        break;
      case 4:
        cache.indexType = gl.UNSIGNED_INT;
        break;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
    if (cache.normalBuffer != null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, cache.normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);
    }
    if (cache.uvBuffer != null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, cache.uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.uvs, gl.STATIC_DRAW);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cache.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
  }

  /**
   * Uploads a texture to the GPU.
   *
   * ## Note
   *
   * Only a few texture parameters are used. If you need more fancy stuff,
   * please feel free to improve this method.
   *
   * For the scope of the assignment, the method should work perfectly to
   * upload your enviroment maps, as well as your model textures
   *
   * @param texture - The [[Texture]] instance to upload
   */
  public uploadTexture(texture: Texture) {
    const gl = this._gl;
    const glObject = gl.createTexture()!;

    const bindType = texture.glBindType();
    gl.bindTexture(bindType, glObject);

    if (texture instanceof Texture2D) {
      if ((texture.data as PixelArray).buffer != null) {
        // Raw data.
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          texture.internalFormatGL,
          texture.width,
          texture.height,
          0,
          texture.formatGL,
          // gl.FLOAT,
          texture.typeGL,
          texture.data,
          0
        );
      } else {
        // HTML element data.
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          texture.internalFormatGL,
          texture.formatGL,
          texture.typeGL,
          texture.data
        );
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, texture.flipY);
    }

    gl.texParameteri(bindType, gl.TEXTURE_MIN_FILTER, texture.minFilterGL);
    gl.texParameteri(bindType, gl.TEXTURE_MAG_FILTER, texture.maxFilterGL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, texture.wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, texture.wrapT);
    this._textures.set(texture, { glObject });
  }

  /**
   * Deletes a geometry from the WebGL context.
   *
   * @param geometry - The geometry to delete
   */
  public destroyGeometry(geometry: Geometry) {
    const cache = this._geometries.get(geometry);
    if (cache) {
      const gl = this._gl;
      gl.deleteBuffer(cache.indexBuffer);
      gl.deleteBuffer(cache.positionBuffer);
    }
  }

  /**
   * Deletes a program from the WebGL context.
   *
   * ## Note
   *
   * This will delete the program, the vertex shader, as well as the frament
   * shader.
   *
   * @param geometry - The geometry to delete
   */
  public destroyProgram(program: Shader) {
    const gl = this._gl;
    const cache = this._programs.get(program);
    if (cache === undefined || cache === null) {
      return;
    }

    if (cache.programObjectGL) {
      if (cache.vertexObjectGL) {
        gl.detachShader(cache.programObjectGL, cache.vertexObjectGL);
      }
      if (cache.fragmentObjectGL) {
        gl.detachShader(cache.programObjectGL, cache.fragmentObjectGL);
      }
      gl.deleteProgram(cache.programObjectGL);
    }
    if (cache.vertexObjectGL) {
      gl.deleteShader(cache.vertexObjectGL);
    }
    if (cache.fragmentObjectGL) {
      gl.deleteShader(cache.fragmentObjectGL);
    }
  }

  /**
   * Draws a geometry using the specified shader and feeds the shader with
   * the given uniforms.
   *
   * @param {Geometry} geometry - The geometry to draw
   * @param {Shader} shader - The shader to use for drawing
   * @param {(Record<string, UniformType | Texture>)} uniforms - The object
   *   containing uniforms to forward to the shader
   */
  public draw(
    geometry: Geometry,
    shader: Shader,
    uniforms: Record<string, UniformType | Texture>
  ) {
    const geometryCache = this._geometries.get(geometry);
    if (!geometryCache) {
      console.error('Attempting to draw a geometry that isnt on the GPU');
      return;
    }

    const programCache = this._programs.get(shader);
    if (programCache === undefined) {
      console.error('Attempting to use a non-compiled program.');
      return;
    } else if (programCache === null) {
      return;
    }

    const gl = this._gl;
    const uniformsLUT = programCache.uniformLocationLUT;

    const VAOs = programCache.vaoList;
    if (!VAOs.has(geometry)) {
      VAOs.set(geometry, {
        glObject: this._createVAO(programCache.programObjectGL!, geometryCache)
      });
    }
    const vao = programCache.vaoList.get(geometry)!;

    gl.useProgram(programCache.programObjectGL);
    gl.bindVertexArray(vao.glObject);

    // Sends uniforms to GPU.
    for (const uniformId in uniforms) {
      // **Note**: optimization possible here. For heavy uniforms, it's possible
      // to keep a cache in order to avoid making useless GPU calls (which are always expensive).
      const info = uniformsLUT.get(uniformId);
      if (info === undefined) {
        continue;
      }
      const uniformValue = uniforms[uniformId];
      if ((uniformValue as Texture).isTexture) {
        // @todo: check for max texture unit slot.
        const unit = this._textureUnitSlot++;
        gl.activeTexture(gl.TEXTURE0 + unit);
        this._bindTexture(uniformValue as Texture);
        uploadUniform(gl, info.location, info.type, unit);
      } else {
        uploadUniform(
          gl,
          info.location,
          info.type,
          uniformValue as UniformType
        );
      }
    }

    gl.drawElements(
      geometry.mode,
      geometry.indices.length,
      geometryCache.indexType,
      0
    );

    // @note: this is a clearly not the most optimized things to do,
    // but we have more interesting stuff to work on :)
    this._textureUnitSlot = 0;
  }

  /**
   * Clears the currently bound framebuffer
   */
  public clear() {
    // NOTE: we know we never change the clear color. If we were to change it
    // somewhere, it would need to be set back to the good color before.
    this._gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
  }

  /**
   * Internal method handling the creation of a Vertex Array Object.
   *
   * @param program - The program to which the VAO will be run with
   * @param geometryCache - The cache of the geometry associated to the VAO
   *   to create
   *
   * ## Note
   *
   * Failures aren't handled.
   *
   * @private
   *
   * @return The created VAO
   */
  private _createVAO(
    program: WebGLProgram,
    geometryCache: GeometryCache
  ): WebGLVertexArrayObject {
    const gl = this._gl;
    const vao = gl.createVertexArray()!;

    // @fix: this can be cached.
    const positionAttributeLocation = gl.getAttribLocation(
      program,
      'in_position'
    );
    const normalAttributeLocation = gl.getAttribLocation(program, 'in_normal');
    const uvAttributeLocation = gl.getAttribLocation(program, 'in_uv');

    const hasNormal =
      normalAttributeLocation != -1 && geometryCache.normalBuffer !== null;
    const hasUV = uvAttributeLocation != -1 && geometryCache.uvBuffer !== null;

    let strideComp = 3;
    strideComp = hasNormal ? strideComp + 3 : strideComp;
    strideComp = hasUV ? strideComp + 2 : strideComp;

    const byteSize = Float32Array.BYTES_PER_ELEMENT;

    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, geometryCache.positionBuffer);
    gl.vertexAttribPointer(
      positionAttributeLocation,
      3,
      gl.FLOAT,
      false,
      3 * byteSize,
      0
    );

    // **Note**: the code assumes a geometry **always** has normals.
    // To be as generic as possible, you would:
    //    * Upload normal only when available
    //    * Recompile a shader variant that strips the code for the normal away
    if (hasNormal) {
      gl.enableVertexAttribArray(normalAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, geometryCache.normalBuffer);
      gl.vertexAttribPointer(
        normalAttributeLocation,
        3,
        gl.FLOAT,
        false,
        3 * byteSize,
        0
      );
    }

    if (hasUV) {
      // Only setup the UV attribute if the geometry has UVs.
      gl.enableVertexAttribArray(uvAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, geometryCache.uvBuffer);
      gl.vertexAttribPointer(
        uvAttributeLocation,
        2,
        gl.FLOAT,
        false,
        2 * byteSize,
        0
      );
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometryCache.indexBuffer);
    return vao;
  }

  /**
   * Binds a given texture.
   *
   * @param texture - The texture to bind
   *
   * @private
   */
  private _bindTexture(texture: Texture) {
    const gl = this._gl;
    const cache = this._textures.get(texture);
    if (!cache) {
      return;
    }
    gl.bindTexture(texture.glBindType(), cache.glObject);
  }

  /** Returns the inner [[WebGL2RenderingContext]] instance */
  public get gl(): WebGL2RenderingContext {
    return this._gl;
  }
}

///////////////////////////////////////////////////////////////////////////////
/////////////////////////////     UTILS      //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    console.error('[ SHADER ]: Failed to compile shader. Info:');
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function compileProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    console.error('[ PROGRAM ]: Failed to compile program. Info:');
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export function preprocessShader(
  source: string,
  defines: Record<string, boolean | number>
): string {
  let definesStr = '';
  for (const name in defines) {
    const val = defines[name];
    if (val) {
      // Here we really want to test `=== true` and not simply something like:
      // `!!val`.
      definesStr +=
        val === true ? `#define ${name}\n` : `#define ${name} ${val}\n`;
    }
  }
  return `#version 300 es\n\n${definesStr}\n${source}`;
}

export function getActiveUniformsInfo(
  gl: WebGL2RenderingContext,
  program: WebGLProgram
): Map<string, UniformInfo> {
  const output = new Map();
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; ++i) {
    const info = gl.getActiveUniform(program, i);
    if (info !== null) {
      const location = gl.getUniformLocation(program, info.name);
      if (location !== null) {
        output.set(info.name, { location, type: info.type });
      }
    }
  }
  return output;
}

export function uploadUniform(
  gl: WebGL2RenderingContext,
  loc: WebGLUniformLocation,
  type: number,
  value: UniformType
) {
  // **Note**: possible optimization would be to
  // save function pointer per type.

  switch (type) {
    case gl.BOOL:
      gl.uniform1ui(loc, value as number);
    case gl.FLOAT:
      gl.uniform1f(loc, value as number);
      break;
    case gl.FLOAT_VEC2:
      gl.uniform2fv(loc, value as Float32Array);
      break;
    case gl.FLOAT_VEC3:
      gl.uniform3fv(loc, value as Float32Array);
      break;
    case gl.FLOAT_VEC4:
      gl.uniform4fv(loc, value as Float32Array);
      break;
    case gl.FLOAT_MAT2:
      gl.uniformMatrix2fv(loc, false, value as Float32Array);
      break;
    case gl.FLOAT_MAT3:
      gl.uniformMatrix3fv(loc, false, value as Float32Array);
      break;
    case gl.FLOAT_MAT4:
      gl.uniformMatrix4fv(loc, false, value as Float32Array);
      break;
    case gl.INT:
      gl.uniform1i(loc, value as number);
      break;
    case gl.INT_VEC2:
      gl.uniform2iv(loc, value as Uint16Array);
      break;
    case gl.INT_VEC3:
      gl.uniform3iv(loc, value as Uint16Array);
      break;
    case gl.INT_VEC4:
      gl.uniform4iv(loc, value as Uint16Array);
      break;

    // **Note**: texture arrays not supported. Several texture units
    // would need to be set.
    case gl.SAMPLER_2D:
    case gl.SAMPLER_CUBE:
      gl.uniform1i(loc, value as number);
      break;
  }
}

///////////////////////////////////////////////////////////////////////////////
/////////////////////////////     TYPES      //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export interface UniformInfo {
  location: WebGLUniformLocation;
  type: number;
}

interface GeometryCache {
  positionBuffer: WebGLBuffer;
  normalBuffer: WebGLBuffer;
  uvBuffer: WebGLBuffer | null;
  indexBuffer: WebGLBuffer;
  indexType: number;
}

interface VAOCache {
  glObject: WebGLVertexArrayObject;
}

interface TextureCache {
  glObject: WebGLTexture;
}

interface ProgramCache {
  programObjectGL: WebGLProgram | null;
  vertexObjectGL: WebGLShader | null;
  fragmentObjectGL: WebGLShader | null;
  uniformLocationLUT: Map<string, UniformInfo>;
  vaoList: Map<Geometry, VAOCache>;
}
