/**
 * @author {DavidPeicho}
 */

import { Geometry } from './geometry';

/**
 * Simple box geometry.
 *
 * @category Geometry
 */
export class CubeGeometry extends Geometry {
  public constructor(width = 1, height = 1, depth = 1) {
    width *= 0.5;
    height *= 0.5;
    depth *= 0.5;
    const positions = new Float32Array([
      // Front face
      -width,
      -height,
      depth,
      width,
      -height,
      depth,
      width,
      height,
      depth,
      -width,
      height,
      depth,
      // Back face
      -width,
      -height,
      -depth,
      -width,
      height,
      -depth,
      width,
      height,
      -depth,
      width,
      -height,
      -depth,
      // Top face
      -width,
      height,
      -depth,
      -width,
      height,
      depth,
      width,
      height,
      depth,
      width,
      height,
      -depth,
      // Bottom face
      -width,
      -height,
      -depth,
      width,
      -height,
      -depth,
      width,
      -height,
      depth,
      -width,
      -height,
      depth,
      // Right face
      width,
      -height,
      -depth,
      width,
      height,
      -depth,
      width,
      height,
      depth,
      width,
      -height,
      depth,
      // Left face
      -width,
      -height,
      -depth,
      -width,
      -height,
      depth,
      -width,
      height,
      depth,
      -width,
      height,
      -depth
    ]);

    const normals = new Float32Array([
      // Front face
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
      // Back face
      0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
      // Top face
      0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
      // Bottom face
      0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
      // Right face
      1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
      // Left face
      -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0
    ]);
    const uvs = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
    const indices = new Uint8Array([
      0,
      1,
      2,
      0,
      2,
      3, // front
      4,
      5,
      6,
      4,
      6,
      7, // back
      8,
      9,
      10,
      8,
      10,
      11, // top
      12,
      13,
      14,
      12,
      14,
      15, // bottom
      16,
      17,
      18,
      16,
      18,
      19, // right
      20,
      21,
      22,
      20,
      22,
      23 // left
    ]);
    super(positions, normals, uvs, indices);
  }
}
