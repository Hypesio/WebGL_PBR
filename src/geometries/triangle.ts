/**
 * @author {DavidPeicho}
 */

import { Geometry } from './geometry';

/**
 * Triangle geometry.
 *
 * @category Geometry
 */
export class TriangleGeometry extends Geometry {
  public constructor() {
    const positions = new Float32Array([
      -0.5, -0.5, 0, 0.5, -0.5, 0.0, -0.5, 0.5, 0.0
    ]);
    const normals = new Float32Array([
      0.0, 0.0, -1, 0.0, 0.0, -1, 0.0, 0.0, -1
    ]);
    const uvs = new Float32Array([0.0, 0.0, 1.0, 0.0, 1.0, 1.0]);
    const indices = new Uint8Array([0, 1, 2]);

    super(positions, normals, uvs, indices);
  }
}
