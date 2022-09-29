/**
 * Class containing the sources of the shader, i.e., Vertex Shader and
 * Fragment Shader.
 *
 * ## Variant
 *
 * It's possible to compile different variant of the shader using the `defines`
 * object. The `defines` object will be prepended to the shader to allow
 * conditional compilation.
 */
export class Shader {
  /** Shader defines, prepended to the shader before compilation on the GPU */
  public defines: Record<string, boolean | number>;

  /** String containing the vertex shader source */
  private _vertexSource: string;

  /** String containing the fragment shader source */
  private _fragmentSource: string;

  public constructor(vertex: string, fragment: string) {
    this.defines = {};
    this._vertexSource = vertex;
    this._fragmentSource = fragment;
  }

  /** String containing the vertex shader source */
  public get vertexSource(): string {
    return this._vertexSource;
  }

  /** String containing the fragment shader source */
  public get fragmentSource(): string {
    return this._fragmentSource;
  }
}
