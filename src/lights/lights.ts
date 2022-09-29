import { vec3 } from 'gl-matrix';

/**
 * Abstract class for a ponctual light
 */
export abstract class PonctualLight {
  /**
   * RGB color of the light.
   *
   * ## Note
   *
   * In order to use meaningful data, it could be a great idea to use
   * temperature or a physical unit such as Lumen.
   */
  public color: vec3;
  public intensity: number;

  public constructor() {
    this.color = vec3.set(vec3.create(), 1.0, 1.0, 1.0);
    this.intensity = 1.0;
  }

  public setColorRGB(r: number, g: number, b: number): this {
    vec3.set(this.color, r, g, b);
    return this;
  }

  public setIntensity(intensity: number): this {
    this.intensity = intensity;
    return this;
  }
}

/**
 * Light emitting uniformly in a single direction. No attenuation occurs.
 *
 * Directional lights are often used to simulate outdoor light, such as light
 * coming from the sun. Basically light that is far enough that it can be
 * approximated as coming only from a single direction.
 */
export class DirectionalLight extends PonctualLight {
  /**
   * Light direction, in World Space
   */
  public directionWS: vec3;

  public constructor() {
    super();
    this.directionWS = vec3.set(vec3.create(), 0.0, 0.0, 1.0);
  }

  /**
   * Set the World Spacce direction of this light.
   *
   * ## Note
   *
   * The direction will be normalized by this method.
   *
   * @param x - x-coordinate of the direction
   * @param {number} y - y-coordinate of the direction
   * @param {number} z - z-coordinate of the direction
   *
   * @return This instance, for chaining
   */
  public setDirection(x: number, y: number, z: number): this {
    vec3.set(this.directionWS, x, y, z);
    vec3.normalize(this.directionWS, this.directionWS);
    return this;
  }
}

/**
 * Light emitting uniformly in all directions. A point light source will be
 * attenuated with distance.
 *
 * Point lights are considered infinitesimally small.
 */
export class PointLight extends PonctualLight {
  /** Position of the point light, in World Space. */
  public positionWS: vec3;

  public constructor() {
    super();
    this.positionWS = vec3.set(vec3.create(), 0.0, 0.0, 0.0);
  }

  /**
   * Set the World Spacce position of this light.
   *
   * @param x - x-coordinate of the position
   * @param {number} y - y-coordinate of the position
   * @param {number} z - z-coordinate of the position
   *
   * @return This instance, for chaining
   */
  public setPosition(x: number, y: number, z: number): this {
    vec3.set(this.positionWS, x, y, z);
    return this;
  }
}
