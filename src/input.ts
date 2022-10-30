import { quat, vec2, vec3 } from 'gl-matrix';
import { Camera } from './camera';

let mouseX: number = 0;
let mouseY: number = 0; 
let previousMouseX: number = 0;
let previousMouseY: number = 0; 
let height: number = 0;
let mouseclick: boolean = false;
let pitch : number = 0;
let yaw : number = 0;


document.addEventListener( 'mousemove', function( event ) {
    mouseX = event.pageX;
    mouseY = height - event.pageY;
  });

document.addEventListener( 'mousedown', function( event ) {
    mouseclick = true;
});

document.addEventListener( 'mouseup', function( event ) {
    mouseclick = false;
});


function moveCamera(camera: Camera, mouseDelta: vec2, cameraDistance: number) {
    pitch = -mouseDelta[0] / 100;
    yaw = mouseDelta[1] / 100;

    let focus_cam_point = vec3.set(vec3.create(), 0, 0, -7);

    // Rotate the camera around the focus point
    let directionTop: vec3 = vec3.set(vec3.create(), 0, 1, 0);
    let directionRight: vec3 = vec3.set(vec3.create(), 1, 0, 0);
    
    let rotTop = quat.setAxisAngle(quat.create(), directionTop, pitch); 
    let rotRight = quat.setAxisAngle(quat.create(), directionRight, yaw); 
    
    let diff = vec3.sub(vec3.create(), camera.transform.position, focus_cam_point);
    let a = quat.set(quat.create(), diff[0], diff[1], diff[2], 0);
    let b = quat.mul(quat.create(), quat.multiply(quat.create(), rotTop, rotRight), a);
    let newPosition = vec3.add(vec3.create(), vec3.set(vec3.create(),b[0], b[1], b[2]), focus_cam_point);
     
    camera.transform.position = newPosition; 
    
    let rotTop2 = quat.setAxisAngle(quat.create(), directionTop, pitch/2); 
    let rotRight2 = quat.setAxisAngle(quat.create(), directionRight, yaw/2); 
    quat.multiply(camera.transform.rotation, quat.multiply(quat.create(), rotTop2, rotRight2), camera.transform.rotation);
    
}

export function updateInputs(canvas: HTMLCanvasElement, camera: Camera) {
    let cameraDistance : number = vec3.len(camera.transform.position);
    
    height = canvas.height;
    let mouseDelta = vec2.set(vec2.create(), mouseX - previousMouseX, mouseY - previousMouseY);
    
    if (mouseclick && (Math.abs(mouseDelta[0]) > 0.0001 || Math.abs(mouseDelta[1]) > 0.0001))
        moveCamera(camera, mouseDelta, cameraDistance);

    previousMouseX = mouseX;
    previousMouseY = mouseY;
    //console.log(mouseX +  " " + mouseY); 
}
