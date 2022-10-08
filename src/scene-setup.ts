import { mat4, vec3 } from 'gl-matrix';
import { GameObject } from './game-object';
import { Geometry } from './geometries/geometry';
import { PointLight } from './lights/lights';
import { Material } from './material';



export function setupSceneSpheres(geometry: Geometry): GameObject[] {
    let width = 5; 
    let height = 5; 
    let lenBorder = 5; 
    let distanceSphere = lenBorder / (width - 1); 
    let increaseParam = 1 / (width - 1);
    let startPosition = vec3.set(vec3.create(), -lenBorder/2, -lenBorder/2, 7);
    let position = vec3.set(vec3.create(), -lenBorder/2, -lenBorder/2, 7);

    let spheres = []; 
    

    for (let i = 0; i < height; i++) {
        position[0] = startPosition[0] + distanceSphere * i;
        for(let j = 0; j < width; j++) {
            position[1] = startPosition[1] + distanceSphere * j;

            let metallic = increaseParam * i;
            let roughness = increaseParam * j;
            let material = new Material(metallic, vec3.set(vec3.create(),0.7, 0.7, 0.7), roughness);
            let go = new GameObject(geometry, material);
            vec3.copy(go.transform.position, position);
            spheres.push(go);
        }
    }

    return spheres;
}

export function setupScenePointLight(): PointLight[] {
    let lights = []; 
    lights.push(new PointLight());
    lights[0].positionWS = vec3.set(vec3.create(),-2, -2, 1); 
    lights.push(new PointLight());
    lights[1].positionWS = vec3.set(vec3.create(),-2, -2, 1); 
    lights.push(new PointLight());
    lights[2].positionWS = vec3.set(vec3.create(),2, -2, 0); 
    lights.push(new PointLight());
    lights[3].positionWS = vec3.set(vec3.create(),2, 2, 0); 

    return lights;
}