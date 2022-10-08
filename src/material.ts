import { vec3 } from "gl-matrix";

/**
 * Contain data to change shader visuals
 */
export class Material {
    public metallic: number;
    public albedo: vec3; 
    public roughness: number;

    public constructor(metallic: number, albedo: vec3, roughness: number){
        this.metallic = metallic; 
        this.roughness = roughness; 
        this.albedo = albedo;
    }
}
  