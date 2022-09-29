import { PixelArray } from '../types';

/**
 * Abstract class to describe a texture.
 *
 * ## Notes
 *
 * This class isn't fully compliant with WebGL and some texture format / type
 * combination will definitelly **not work**.
 *
 * This is an assignment and I wasn't going to create a fully-featured
 * WebGL abstraction :)
 */
export abstract class Texture {
  /**
   * Every instances of [[Texture]] will have this boolean set to `true`. This
   * allows for fast check whether an object is a texture or not.
   */
  public readonly isTexture!: boolean;

  /**
   * Texture wrap parameter in the S direction
   */
  public wrapS: number;

  /**
   * Texture wrap parameter in the T direction
   */
  public wrapT: number;

  /**
   * Filtering type for minification
   */
  public minFilterGL: number;

  /**
   * Filtering type for magnification
   */
  public maxFilterGL: number;

  /**
   * WebGL texture format
   *
   * @private
   */
  private readonly _formatGL: number;

  /**
   * WebGL texture internal format
   *
   * @private
   */
  private readonly _internalFormatGL: number;

  /**
   * WebGL texture type
   *
   * @private
   */
  private readonly _typeGL: number;

  constructor(format: number, internalFormat: number, type: number) {
    this._formatGL = format;
    this._internalFormatGL = internalFormat;
    this._typeGL = type;
    this.wrapS = WebGL2RenderingContext.CLAMP_TO_EDGE;
    this.wrapT = WebGL2RenderingContext.CLAMP_TO_EDGE;
    this.minFilterGL = WebGL2RenderingContext.LINEAR;
    this.maxFilterGL = WebGL2RenderingContext.LINEAR;
  }

  /**
   * Returns the WebGL binding type of the texture, i.e.,
   * `TEXTURE_2D`, etc...
   *
   * This is used to easily bind the texture without worrying about what type
   * it actually is
   */
  public abstract glBindType(): number;

  /** WebGL texture format */
  public get formatGL(): number {
    return this._formatGL;
  }

  /** WebGL texture type */
  public get typeGL(): number {
    return this._typeGL;
  }

  /** WebGL texture internal format */
  public get internalFormatGL(): number {
    return this._internalFormatGL;
  }
}
(Texture.prototype.isTexture as boolean) = true;

/**
 * Class containing data for a 2D texture
 */
export class Texture2D<T extends PixelArray | HTMLElement> extends Texture {
  /**
   * Loads a 2D texture (JPG or PNG) from a given URL.
   *
   * ## Note
   *
   * 1. Only RGBA textures are supported
   * 2. This method uses the browser image decoder
   *
   * @param url - The URL pointing to the image to load
   *
   * @return A promise resolving to an instance of [[Texture2D]] contaning the
   *   image data, `null` id loading failed
   */
  public static async load(
    url: string
  ): Promise<Texture2D<HTMLElement> | null> {
    const image = await fetchPNG(url);
    const tex = new Texture2D<HTMLElement>(
      image.data,
      image.width,
      image.height,
      image.formatGL,
      image.internalFormatGL,
      image.typeGL
    );
    // Images loaded with the browser decoding have a different coordinate
    // system than the WebGL one.
    tex.flipY = true;
    return tex;
  }

  /** If `true`, the image will be flipped when uploaded to the GPU */
  public flipY: boolean;

  /**
   * Contains the pixel buffer
   *
   * @private
   */
  private _data: T;
  private _width: number;
  private _height: number;

  public constructor(
    data: T,
    width: number,
    height: number,
    formatGL: number,
    internalFormatGL: number,
    typeGL: number
  ) {
    super(formatGL, internalFormatGL, typeGL);
    this.flipY = false;
    this._data = data;
    this._width = width;
    this._height = height;
  }

  /** @inheritdoc */
  public glBindType(): number {
    return WebGL2RenderingContext.TEXTURE_2D;
  }

  /** Pixel buffer */
  public get data(): T {
    return this._data;
  }

  public get width(): number {
    return this._width;
  }

  public get height(): number {
    return this._height;
  }
}

/**
 * Fetches a PNG/JPG file using HTTP request. The texutre is decoded using
 * the browser's decoder.
 *
 * @param url - URL to the texture to fetch
 *
 * @return An object containing the image pixel buffer, as well as information
 *   about the channels and type
 */
function fetchPNG(url: string): Promise<Image2D<HTMLElement>> {
  return new Promise((res, rej) => {
    const image = new Image();
    image.onload = () => {
      res({
        data: image,
        width: image.width,
        height: image.height,
        formatGL: WebGL2RenderingContext.RGBA,
        internalFormatGL: WebGL2RenderingContext.RGBA,
        typeGL: WebGL2RenderingContext.UNSIGNED_BYTE
      });
    };
    image.src = url;
  });
}

/**
 * Interface describing a simple 2D image
 */
interface Image2D<T extends PixelArray | HTMLElement> {
  width: number;
  height: number;
  formatGL: number;
  internalFormatGL: number;
  typeGL: number;
  data: T;
}
