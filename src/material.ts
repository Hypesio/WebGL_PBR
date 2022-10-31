import { vec3 } from "gl-matrix";
import { Texture2D } from "./textures/texture";

/**
 * Contain data to change shader visuals
 */
export class Material {
    public metallic: number;
    public albedo: vec3; 
    public roughness: number;
    public texAlbedo : Texture2D<HTMLElement> | null;
    public texNormal : Texture2D<HTMLElement> | null;
    public texRoughness : Texture2D<HTMLElement> | null;

    public constructor(metallic: number, albedo: vec3, roughness: number){
        this.metallic = metallic; 
        this.roughness = roughness; 
        this.albedo = albedo;
        this.texAlbedo = null; 
        this.texNormal = null; 
        this.texRoughness = null;
    }

    public setTextures(albedo: Texture2D<HTMLElement> | null, normal: Texture2D<HTMLElement> | null, roughness: Texture2D<HTMLElement> | null) {
        this.texAlbedo = albedo; 
        this.texNormal = normal; 
        this.texRoughness = roughness;
    }
}
  