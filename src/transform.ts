import { mat4, quat, vec3 } from 'gl-matrix';

/**
 * Helper class driving a 4x4 matrix from:
 *   * A 3D vector describing translation
 *   * A 3D vector describing scale
 *   * A Quaternion describing rotation
 */
export class Transform {
  /** Local translation */
  public position: vec3;

  /** Local scale */
  public scale: vec3;

  /** Local rotation */
  public rotation: quat;

  /**
   * Matrix containing the transformation of the `position`, `scale`, and
   * `rotation`.
   *
   * @private
   */
  private _matrix: mat4;

  public constructor() {
    this.position = vec3.create();
    this.scale = vec3.set(vec3.create(), 1.0, 1.0, 1.0);
    this.rotation = quat.create();
    this._matrix = mat4.create();
  }

  /**
   * Update the internal matrix using the [[Transform.position]]
   * [[Transform.scale]], and [[Transform.rotation]] attributes.
   *
   * ## Note
   *
   * The resulting matrix is computed the following way:
   *
   * ```
   * matrix = translation * rotation * scale
   * ```
   *
   * @return The cached matrix containing all the transformations
   */
  public combine(): mat4 {
    mat4.fromRotationTranslationScale(
      this._matrix,
      this.rotation,
      this.position,
      this.scale
    );
    return this._matrix;
  }

  /**
   * Matrix containing the [[Transform.position]], [[Transform.scale]], and
   * [[Transform.rotation]]
   */
  public get matrix(): mat4 {
    return this._matrix;
  }
}
