import { mat4 } from 'gl-matrix';
import { Transform } from './transform';

/**
 * Helper for a camera. This allows to easily cache the view matrix, as well
 * as to create the perspective projection.
 */
export class Camera {
  public transform: Transform;
  public worldToLocal: mat4;
  public projection: mat4;
  public localToProjection: mat4;

  public constructor() {
    this.transform = new Transform();
    this.worldToLocal = mat4.create();
    this.projection = mat4.create();
    this.localToProjection = mat4.create();
  }

  public setParameters(aspect: number, near = 0.1, far = 100.0): this {
    mat4.perspective(this.projection, 0.785, aspect, near, far);
    return this;
  }

  public update() {
    this.transform.combine();
    mat4.invert(this.worldToLocal, this.transform.matrix);
    mat4.multiply(this.localToProjection, this.projection, this.worldToLocal);
  }
}
