import { GUI } from 'dat.gui';
import { mat4, quat, vec3 } from 'gl-matrix';
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
import { updateInputs } from './input';

interface GUIProperties {
  albedo: number[];
  lightsActive: number;
  enableSpecular: boolean;
  enableDiffuse: boolean;
  resetCam: boolean;
  IBLDiffuse: boolean;
  IBLSpecular: boolean;
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

  private _texture_diffuseIBL: Texture2D<HTMLElement> | null;
  private _texture_specularIBL: Texture2D<HTMLElement> | null;
  private _texture_BRDFIntegrationMap: Texture2D<HTMLElement> | null;

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
    vec3.set(this._camera.transform.position, 0.0, 0.0, 2.0);

    this._uniforms = {
      'uMaterial.albedo': vec3.create(),
      'uMaterial.roughness': 0.0,
      'uMaterial.metallic': 1.0,
      'uModel.localToProjection': mat4.create(),
      'uModel.modelMat': mat4.create(),
      'viewPosition': vec3.create(),
      'enableSpecular': true,
      'enableDiffuse': true,
      'enableIBLDiffuse': true,
      'enableIBLSpecular': true,
    };

    // Init geometries
    this._geometries = [];
    this._geometries.push(new SphereGeometry(0.5, 20, 20));

    // Init objects
    this._gameObjects = setupSceneSpheres(this._geometries[0]);

    // Init point lights
    this._lights = setupScenePointLight();
    let i = 0;
    this._lights.forEach(light => {
      this._uniforms["lights[" + i.toString() + "].position"] = vec3.create();
      this._uniforms["lights[" + i.toString() + "].color"] = vec3.create();
      this._uniforms["lights[" + i.toString() + "].intensity"] = 20.0;
      this._uniforms["lights[" + i.toString() + "].isActive"] = 1.0;
      i += 1;
    });

    this._shader = new PBRShader();
    this._texture_diffuseIBL = null;
    this._texture_specularIBL = null;
    this._texture_BRDFIntegrationMap = null;

    this._guiProperties = {
      albedo: [255, 255, 255],
      lightsActive: 4,
      enableSpecular: true,
      enableDiffuse: true,
      resetCam: false,
      IBLDiffuse: true,
      IBLSpecular: true,
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

    // Load diffuse IBL.
    this._texture_diffuseIBL = await Texture2D.load(
      'assets/env/Alexs_Apt_2k-diffuse-RGBM.png'
    );
    if (this._texture_diffuseIBL !== null) {
      this._context.uploadTexture(this._texture_diffuseIBL);
      // You can then use it directly as a uniform:
      this._uniforms['diffuse_IBL'] = this._texture_diffuseIBL;
    }

    // Load specular IBL
    this._texture_specularIBL = await Texture2D.load(
      'assets/env/Alexs_Apt_2k-specular-RGBM.png'
    );
    if (this._texture_specularIBL !== null) {
      this._context.uploadTexture(this._texture_specularIBL);
      // You can then use it directly as a uniform:
      this._uniforms['specular_IBL'] = this._texture_specularIBL;
    }

    // Load BRDF Integration Map 
    this._texture_BRDFIntegrationMap = await Texture2D.load(
      'assets/env/Alexs_Apt_2k-specular-RGBM.png');
    if (this._texture_BRDFIntegrationMap !== null) {
      this._context.uploadTexture(this._texture_BRDFIntegrationMap);
      // You can then use it directly as a uniform:
      this._uniforms['specular_IBL'] = this._texture_BRDFIntegrationMap;
    }
  }


  /**
   * Called at every loop, before the [[Application.render]] method.
   */
  update() {
    if (this._guiProperties.resetCam) {
      this._guiProperties.resetCam = false;
      this._camera.transform.rotation = quat.create();
      this._camera.transform.position = vec3.set(vec3.create(), 0, 0, 2);
    }

    updateInputs(canvas, this._camera);

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
    camera.setParameters(aspect);
    camera.update();

    const props = this._guiProperties;

    // Set booleans
    this._uniforms['enableSpecular'] = props.enableSpecular;
    this._uniforms['enableDiffuse'] = props.enableDiffuse;
    this._uniforms['enableIBLSpecular'] = props.IBLSpecular;
    this._uniforms['enableIBLDiffuse'] = props.IBLDiffuse;

    // Set the color from the GUI into the materials
    this._gameObjects.forEach(go => {
      go.material.albedo = vec3.set(vec3.create(), props.albedo[0] / 255, props.albedo[1] / 255, props.albedo[2] / 255);
    });


    // Set the camera position for the shaders
    vec3.set(this._uniforms['viewPosition'] as vec3, camera.transform.position[0], camera.transform.position[1], camera.transform.position[2]);

    // Set lights datas
    let i = 0;
    this._lights.forEach(light => {
      vec3.copy(this._uniforms["lights[" + i.toString() + "].position"] as vec3, light.positionWS);
      vec3.copy(this._uniforms["lights[" + i.toString() + "].color"] as vec3, light.color);
      this._uniforms["lights[" + i.toString() + "].intensity"] = light.intensity;
      this._uniforms["lights[" + i.toString() + "].isActive"] = props.lightsActive > i;
      i += 1;
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
    gui.add(this._guiProperties, 'lightsActive');
    gui.add(this._guiProperties, 'enableSpecular');
    gui.add(this._guiProperties, 'enableDiffuse');
    gui.add(this._guiProperties, 'resetCam');
    gui.add(this._guiProperties, 'IBLDiffuse');
    gui.add(this._guiProperties, 'IBLSpecular');
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


