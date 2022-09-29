/**
 * @author {DavidPeicho}
 */

import { Geometry } from './geometry';

/**
 * Simple plane geometry.
 *
 * @category Geometry
 */
export class PlaneGeometry extends Geometry {
  public constructor(width = 1, height = 1) {
    const positions = new Float32Array([
      -0.5, -0.5, 0, 0.5, -0.5, 0.0, -0.5, 0.5, 0.0, 0.5, 0.5, 0.0
    ]);
    const normals = new Float32Array([
      0.0, 0.0, -1, 0.0, 0.0, -1, 0.0, 0.0, -1, 0.0, 0.0, -1
    ]);
    const uvs = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
    const indices = new Uint8Array([0, 1, 2, 1, 3, 2]);
    super(positions, normals, uvs, indices);
  }
}
