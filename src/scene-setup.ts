import { vec3 } from 'gl-matrix';
import { GameObject } from './game-object';
import { Geometry } from './geometries/geometry';
import { GLContext } from './gl';
import { PointLight } from './lights/lights';
import { Material } from './material';
import { Texture2D } from './textures/texture';



export function setupSceneSpheres(geometry: Geometry): GameObject[] {
    let width = 5; 
    let height = 5; 
    let lenBorder = 5; 
    let distanceSphere = lenBorder / (width - 1); 
    let increaseParam = 1.0 / (width - 1.0);
    let startPosition = vec3.set(vec3.create(), -lenBorder/2, -lenBorder/2, -7);
    let position = vec3.set(vec3.create(), -lenBorder/2, -lenBorder/2, -7);

    let spheres = []; 
    

    for (let i = 0; i < height; i++) {
        position[1] = startPosition[1] + distanceSphere * i;
        for(let j = 0; j < width; j++) {
            position[0] = startPosition[0] + distanceSphere * j;
            let metallic = increaseParam * i + 0.01;
   
            let roughness = increaseParam * j + 0.0;
            //console.log( i + "/" + j + " | Rough " + roughness + " metal" + metallic);
            let material = new Material(metallic, vec3.set(vec3.create(),0.7, 0.7, 0.7), roughness);
            let go = new GameObject(geometry, material);
            vec3.copy(go.transform.position, position);
            spheres.push(go);
        }
        //console.log("Line");
    }

    return spheres;
}

async function initObject(geometry: Geometry, context: GLContext, texturePath: string, position: vec3, size: number): Promise<GameObject> {
    let texColor = await Texture2D.load(texturePath + 'Color.jpg');
    if (texColor !== null) {
        context.uploadTexture(texColor);
    }
    let texNormal = await Texture2D.load(texturePath + 'NormalGL.jpg');
    if (texNormal !== null) {
        context.uploadTexture(texNormal);
    }
    let texRoughness = await Texture2D.load(texturePath + 'Roughness.jpg');
    if (texRoughness !== null) {
        context.uploadTexture(texRoughness);
    }
    let material = new Material(0.0, vec3.set(vec3.create(),0.7, 0.7, 0.7), 0.0);
    material.setTextures(texColor, texNormal, texRoughness);
    let go = new GameObject(geometry, material);
    go.transform.scale = vec3.set(vec3.create(), size, size, size);
    vec3.copy(go.transform.position, position);
    return go;
}

export async function setupScene2Spheres(geometry: Geometry, context: GLContext): Promise<GameObject[]> {
    let position = vec3.set(vec3.create(), 1.5, 1.5, -7);

    let spheres: GameObject[] = []; 

    await initObject(geometry, context, "assets/paper/Paper005_1K_", position, 2.0)
        .then((value) => spheres.push(value));

    position = vec3.fromValues(-1.5, -1.5, -7);
    await initObject(geometry, context, "assets/facade/Facade018A_1K_", position, 2.0)
        .then((value) => spheres.push(value));

    position = vec3.fromValues(1.5, -1.5, -7);
    await initObject(geometry, context, "assets/leather/Leather034C_1K_", position, 2.0)
        .then((value) => spheres.push(value));

    position = vec3.fromValues(-1.5, 1.5, -7);
    await initObject(geometry, context, "assets/bricks/Bricks075B_1K_", position, 2.0)
            .then((value) => spheres.push(value));

    return spheres;
}

export function setupScenePointLight(): PointLight[] {
    let lights = []; 
    let intensity = 20;
    lights.push(new PointLight());
    lights[0].positionWS = vec3.set(vec3.create(),3, -3, -5); 
    lights[0].setIntensity(intensity);
    lights.push(new PointLight());
    lights[1].positionWS = vec3.set(vec3.create(),-3, -3, -5); 
    lights[1].setIntensity(intensity);
    lights.push(new PointLight());
    lights[2].positionWS = vec3.set(vec3.create(),-3, 3, -5); 
    lights[2].setIntensity(intensity);
    lights.push(new PointLight());
    lights[3].positionWS = vec3.set(vec3.create(),3, 3, -5); 
    lights[3].setIntensity(intensity);

    return lights;
}