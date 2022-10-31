import { mat4, vec3 } from 'gl-matrix';
import { Geometry } from './geometries/geometry';
import { Transform } from './transform';
import { GLContext } from './gl';
import { PBRShader } from './shader/pbr-shader';
import { Texture } from './textures/texture';
import { UniformType } from './types';
import { Material } from './material';


/**
 * Hold components and datas of an object
 */
export class GameObject {
  public geometry: Geometry;
  public transform: Transform;
  public worldToLocal: mat4;
  public material: Material;

  public constructor(geometry: Geometry, material: Material) {
    this.transform = new Transform();
    this.worldToLocal = mat4.create();
    this.geometry = geometry;
    this.material = material;
  }


  public update() {
    this.transform.combine();
    mat4.copy(this.worldToLocal, this.transform.matrix);
  }

  public draw(context: GLContext, shader: PBRShader, uniforms: Record<string, UniformType | Texture>) {
    mat4.copy(
        uniforms['uModel.modelMat'] as mat4,
        this.worldToLocal
      );

      vec3.copy(uniforms['uMaterial.albedo'] as vec3, this.material.albedo);
      uniforms['uMaterial.roughness'] = this.material.roughness;
      uniforms['uMaterial.metallic'] = this.material.metallic;
      if (this.material.texAlbedo != null)
        uniforms['uMaterial.texAlbedo'] = this.material.texAlbedo;
      if (this.material.texRoughness != null)
        uniforms['uMaterial.texRoughness'] = this.material.texRoughness;
      if (this.material.texNormal != null)
        uniforms['uMaterial.texNormal'] = this.material.texNormal;

    context.draw(this.geometry, shader, uniforms);
  }
}
