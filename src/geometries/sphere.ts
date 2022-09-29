/**
 * File adapted from:
 * https://github.com/mrdoob/three.js/blob/dev/src/geometries/SphereGeometry.js
 * As well as: https://www.learnopengl.com
 *
 * @author {DavidPeicho}
 */

import { vec3 } from 'gl-matrix';
import { Geometry } from './geometry';

/**
 * Constants
 */

/** ```2 * PI```. Saved for optimization purpose. */
const TWO_PI = 2.0 * Math.PI;

/**
 * Sphere geometry.
 *
 * @category Geometry
 */
export class SphereGeometry extends Geometry {
  /**
   * Radius of the sphere. This is cached to avoid re-computing it if needed.
   *
   * @private
   */
  private _radius: number;

  /**
   * Creates an instance of SphereGeometry.
   *
   * @param radius - Radius of the sphere
   * @param horizontalSegments - Number of horizontal subdivision
   * @param verticalSegments - Number of vertical subdivision
   */
  public constructor(radius = 1, horizontalSegments = 4, verticalSegments = 4) {
    const vertexCount = (horizontalSegments + 1) * (verticalSegments + 1);

    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const vertexTmp = vec3.create();

    let index = 0;
    for (let y = 0; y <= verticalSegments; ++y) {
      const v = y / verticalSegments;
      const theta = v * Math.PI;

      for (let x = 0; x <= horizontalSegments; ++x) {
        const u = x / horizontalSegments;
        vec3.set(
          vertexTmp,
          radius * Math.cos(u * TWO_PI) * Math.sin(theta),
          radius * Math.cos(theta),
          radius * Math.sin(u * TWO_PI) * Math.sin(theta)
        );
        uvs[index * 2] = u;
        uvs[index * 2 + 1] = 1.0 - v;

        positions[index * 3] = vertexTmp[0];
        positions[index * 3 + 1] = vertexTmp[1];
        positions[index * 3 + 2] = vertexTmp[2];

        vec3.normalize(vertexTmp, vertexTmp);
        normals[index * 3] = vertexTmp[0];
        normals[index * 3 + 1] = vertexTmp[1];
        normals[index * 3 + 2] = vertexTmp[2];
        ++index;
      }
    }

    const indices = [];
    for (let y = 0; y < verticalSegments; ++y) {
      if (y === 0 || y % 2 === 0) {
        for (let x = 0; x <= horizontalSegments; ++x) {
          indices.push(y * (horizontalSegments + 1) + x);
          indices.push((y + 1) * (horizontalSegments + 1) + x);
        }
      } else {
        for (let x = horizontalSegments; x >= 0; --x) {
          indices.push((y + 1) * (horizontalSegments + 1) + x);
          indices.push(y * (horizontalSegments + 1) + x);
        }
        indices;
      }
    }

    const indexBuffer = Geometry.createIndexBuffer(indices, vertexCount);
    super(
      positions,
      normals,
      uvs,
      indexBuffer,
      WebGL2RenderingContext.TRIANGLE_STRIP
    );
    this._radius = radius;
  }

  /** Returns the radius of the sphere geometry */
  public get radius() {
    return this._radius;
  }
}
