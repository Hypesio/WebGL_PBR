export default `

precision highp float;

in vec3 in_position;
in vec3 in_normal;
in vec2 in_uv;

/**
 * Varyings.
 */
out vec3 vNormalWS;
out vec3 vUv;
out vec3 fragPosition; 

/**
 * Uniforms List
 */

struct Model
{
  mat4 localToProjection;
};

uniform Model uModel;
uniform mat4 viewMatrix; 

void
main()
{
  gl_Position = uModel.localToProjection * viewMatrix * vec4(in_position, 1.0);
  vUv = in_position;
}
`;
