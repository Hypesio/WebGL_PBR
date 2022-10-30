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
    let increaseParam = 1.0 / (width - 1.0);
    let startPosition = vec3.set(vec3.create(), -lenBorder/2, -lenBorder/2, -7);
    let position = vec3.set(vec3.create(), -lenBorder/2, -lenBorder/2, -7);

    let spheres = []; 
    

    for (let i = 0; i < height; i++) {
        position[1] = startPosition[1] + distanceSphere * i;
        for(let j = 0; j < width; j++) {
            position[0] = startPosition[0] + distanceSphere * j;
            let metallic = increaseParam * i + 0.01;
            let roughness = increaseParam * j + 0.01;
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