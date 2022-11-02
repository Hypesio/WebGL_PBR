/**
 * @author {DavidPeicho}
 */

import { vec2, vec3 } from "gl-matrix";

/**
 * Class containing geometric data to send to the GPU.
 *
 * This class contains the buffer sent as vertex attributes
 *
 * ## Note
 *
 * In order to get a generic geometry, attributes shouldn't be hardcoded.
 * Users might want to send extra attributes that aren't any of those.
 * I don't think it's useful for this assignment to go crazy about it.
 *
 * @category Geometry
 */
export class Geometry {
  public static createIndexBuffer(
    indices: number[],
    vertexCount: number
  ): Uint8Array | Uint16Array | Uint32Array {
    const bytePerIndexNeeded = Math.ceil(Math.log2(vertexCount) / 8);
    if (bytePerIndexNeeded > Uint16Array.BYTES_PER_ELEMENT) {
      return new Uint32Array(indices);
    } else if (bytePerIndexNeeded > Uint8Array.BYTES_PER_ELEMENT) {
      return new Uint16Array(indices);
    }
    return new Uint8Array(indices);
  }

  /** Private Fields. */

  /**
   * Vertices position
   *
   * @private
   */
  private _positions: Float32Array;

  /**
   * Vertices normal
   *
   * @private
   */
  private _normals: Float32Array;

  /**
   * Vertices tangent 
   * @private
   */
  private _tangents: Float32Array;

  /**
   * Vertices UVs
   *
   * @private
   */
  private _uvs: Float32Array | null;

  /**
   * Indices
   *
   * @private
   */
  private _indices: Uint8Array | Uint16Array | Uint32Array;

  /**
   * Drawing mode of the geometry. This should be set to one of the WebGL mode
   * constant
   *
   * @private
   */
  private _mode: number;


  public constructor(
    positions: Float32Array,
    normals: Float32Array,
    uvs: Float32Array | null,
    indices: Uint8Array | Uint16Array | Uint32Array, 
    mode = WebGL2RenderingContext.TRIANGLES
  ) {
    this._positions = positions;
    this._normals = normals;
    this._uvs = uvs;
    this._indices = indices;
    this._mode = mode;
    this._tangents = new Float32Array(this._positions.length); 

    this.computeTangents();
  }

  private findNeighbors(a :number): number[] {
    let neighbors: number[] = []
    
    for (let i = 0; i < this.indices.length; i+= 3) {
      if (this.indices[i] == a)
        return [this.indices[i + 1], this.indices[i + 2]]
      if (this.indices[i + 1] == a)
        return [this.indices[i], this.indices[i + 2]]
      if (this.indices[i + 2] == a)
        return [this.indices[i], this.indices[i + 1]]
    }

    return neighbors; 
  } 

  private computeTangents() {

    if (!this.uvs)
      return;
    // Iterate on all vertices to compte the tangent
    for (let i = 0; i < this._positions.length; i+=3) 
    {
        // Find two neighbors
        let a = Math.floor(i / 3);
        let neighbors: number[] = this.findNeighbors(a);
        
        let posA = vec3.fromValues(this._positions[i], this._positions[i+1], this._positions[i+2]);
        let b = neighbors[0];
        let c = neighbors[1];

        let posB = vec3.fromValues(this._positions[b * 3], this._positions[b * 3+1], this._positions[b * 3+2]);
        let posC = vec3.fromValues(this._positions[c * 3], this._positions[c * 3+1], this._positions[c * 3+2]);
        let edge1 = vec3.subtract(vec3.create(), posB, posA);
        let edge2 = vec3.subtract(vec3.create(), posC, posA);
    
        let uvA = vec2.fromValues(this.uvs[a * 2], this.uvs[a * 2+1]);
        let uvB = vec2.fromValues(this.uvs[b * 2], this.uvs[b * 2+1]);
        let uvC = vec2.fromValues(this.uvs[c * 2], this.uvs[c * 2+1]);
        let uv1 = vec2.subtract(vec2.create(), uvB, uvA);
        let uv2 = vec2.subtract(vec2.create(), uvC, uvA);

        let f = 1.0 / (uv1[0] * uv2[1] - uv2[0] * uv1[1]);
        this._tangents[i] = f * (uv2[1] * edge1[0] - uv1[1] * edge2[0]); 
        this._tangents[i + 1] = f * (uv2[1] * edge1[1] - uv2[1] * edge2[1]);
        this._tangents[i + 2] = f * (uv2[1] * edge1[2] - uv1[1] * edge2[2]);
    }

  }

  /** Returns the typed array containing vertices positions. */
  public get positions(): Float32Array {
    return this._positions;
  }

  /** Returns the typed array containing vertices tangents. */
  public get tangents(): Float32Array {
    return this._tangents;
  }

  /** Returns the typed array containing vertices normals. */
  public get normals(): Float32Array {
    return this._normals;
  }

  /** Returns the typed array containing vertices UVs. */
  public get uvs(): Float32Array | null {
    return this._uvs;
  }

  /** Returns the typed array containing indices. */
  public get indices(): Uint8Array | Uint16Array | Uint32Array {
    return this._indices;
  }

  /** WebGL mode to use when drawing the geometry. */
  public get mode(): number {
    return this._mode;
  }
}
