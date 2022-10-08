import { GUI } from 'dat.gui';
import { mat4, vec3 } from 'gl-matrix';
import { Camera } from './camera';
import { GameObject } from './game-object';
import { Geometry } from './geometries/geometry';
import { SphereGeometry } from './geometries/sphere';
import { TriangleGeometry } from './geometries/triangle';
import { GLContext } from './gl';
import { PointLight } from './lights/lights';
import { setupScenePointLight, setupSceneSpheres } from './scene-setup';
import { PBRShader } from './shader/pbr-shader';
import { Texture, Texture2D } from './textures/texture';
import { UniformType } from './types';

interface GUIProperties {
  albedo: number[];
}

/**
 * Class representing the current application with its state.
 *
 * @class Application
 */
class Application {
  /**
   * Context used to draw to the canvas
   *
   * @private
   */
  private _context: GLContext;
  private _geometries: Geometry[]; 
  private _shader: PBRShader;
  private _gameObjects: GameObject[];
  private _lights: PointLight[];
  private _uniforms: Record<string, UniformType | Texture>;

  private _textureExample: Texture2D<HTMLElement> | null;

  private _camera: Camera;

  /**
   * Object updated with the properties from the GUI
   *
   * @private
   */
  private _guiProperties: GUIProperties;

  constructor(canvas: HTMLCanvasElement) {
    this._context = new GLContext(canvas);
    this._camera = new Camera();

    this._uniforms = {
      'uMaterial.albedo': vec3.create(),
      'uMaterial.roughness': 0.7,
      'uMaterial.metallic': 1.0,
      'uModel.localToProjection': mat4.create(),
      'uModel.modelMat': mat4.create(),
      'viewPosition':vec3.create(),
    };

    // Init geometries
    this._geometries = [];
    this._geometries.push(new SphereGeometry(0.5, 20, 20));

    // Init objects
    this._gameObjects = setupSceneSpheres(this._geometries[0]);

    // Init point lights
    this._lights = setupScenePointLight(); 
    for (let i = 0; i < this._lights.length; i+=1) {
      this._uniforms["lightsPosition[" + i.toString() + "]"] = vec3.create();
    }

    this._shader = new PBRShader();
    this._textureExample = null;

    this._guiProperties = {
      albedo: [255, 255, 255]
    };

    this._createGUI();
  }

  /**
   * Initializes the application.
   */
  async init() {
    this._geometries.forEach(geometry => {
      this._context.uploadGeometry(geometry);
    });
    
    this._context.compileProgram(this._shader);

    // Example showing how to load a texture and upload it to GPU.
    this._textureExample = await Texture2D.load(
      'assets/ggx-brdf-integrated.png'
    );
    if (this._textureExample !== null) {
      this._context.uploadTexture(this._textureExample);
      // You can then use it directly as a uniform:
      // ```uniforms.myTexture = this._textureExample;```
    }
  }

  /**
   * Called at every loop, before the [[Application.render]] method.
   */
  update() {
    this._gameObjects.forEach(go => {
      go.update();
    });
  }

  /**
   * Called when the canvas size changes.
   */
  resize() {
    this._context.resize();
  }

  /**
   * Called at every loop, after the [[Application.update]] method.
   */
  render() {
    this._context.clear();
    this._context.setDepthTest(true);
    // this._context.setCulling(WebGL2RenderingContext.BACK);

    const aspect =
      this._context.gl.drawingBufferWidth /
      this._context.gl.drawingBufferHeight;

    const camera = this._camera;
    vec3.set(camera.transform.position, 0.0, 0.0, 2.0);
    camera.setParameters(aspect);
    camera.update();

    const props = this._guiProperties;

    // Set the color from the GUI into the uniform list.
    vec3.set(
      this._uniforms['uMaterial.albedo'] as vec3,
      props.albedo[0] / 255,
      props.albedo[1] / 255,
      props.albedo[2] / 255
    );

    
    // Set the camera position for the shaders
    vec3.set(this._uniforms['viewPosition'] as vec3, camera.transform.position[0],  camera.transform.position[1],  camera.transform.position[2]);

    // Set lights position
    let i = 0;
    this._lights.forEach(light => {
      vec3.copy(this._uniforms["lightsPosition[" + i.toString() + "]"] as vec3, light.positionWS);
      //console.log("lightsPosition[" + i.toString() + "]");
      i+=1;
    });

    // Sets the viewProjection matrix.
    // **Note**: if you want to modify the position of the geometry, you will
    // need to take the matrix of the mesh into account here.
    mat4.copy(
      this._uniforms['uModel.localToProjection'] as mat4,
      camera.localToProjection
    );

    // Draws all gameobjects
    this._gameObjects.forEach(go => {
      go.draw(this._context, this._shader, this._uniforms);
    });

    // Reset model value changed by gameobjects
    mat4.copy(
      this._uniforms['uModel.modelMat'] as mat4,
      mat4.create()
    );
    
  }

  /**
   * Creates a GUI floating on the upper right side of the page.
   *
   * ## Note
   *
   * You are free to do whatever you want with this GUI. It's useful to have
   * parameters you can dynamically change to see what happens.
   *
   *
   * @private
   */
  private _createGUI(): GUI {
    const gui = new GUI();
    gui.addColor(this._guiProperties, 'albedo');
    return gui;
  }
}

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const app = new Application(canvas as HTMLCanvasElement);
app.init();

function animate() {
  app.update();
  app.render();
  window.requestAnimationFrame(animate);
}
animate();

/**
 * Handles resize.
 */

const resizeObserver = new ResizeObserver((entries) => {
  if (entries.length > 0) {
    const entry = entries[0];
    canvas.width = window.devicePixelRatio * entry.contentRect.width;
    canvas.height = window.devicePixelRatio * entry.contentRect.height;
    app.resize();
  }
});

resizeObserver.observe(canvas);
