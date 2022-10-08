import { mat4 } from 'gl-matrix';
import { Geometry } from './geometries/geometry';
import { Transform } from './transform';
import { GLContext } from './gl';
import { PBRShader } from './shader/pbr-shader';
import { Texture } from './textures/texture';
import { UniformType } from './types';


/**
 * Hold components and datas of an object
 */
export class GameObject {
  public geometry: Geometry;
  public transform: Transform;
  public worldToLocal: mat4;

  public constructor(geometry: Geometry) {
    this.transform = new Transform();
    this.worldToLocal = mat4.create();
    this.geometry = geometry;
  }

  public update() {
    this.transform.combine();
    mat4.invert(this.worldToLocal, this.transform.matrix);
  }

  public draw(context: GLContext, shader: PBRShader, uniforms: Record<string, UniformType | Texture>) {
    mat4.copy(
        uniforms['uModel.modelMat'] as mat4,
        this.worldToLocal
      );

    context.draw(this.geometry, shader, uniforms);

  }
}
