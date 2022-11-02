export default `

precision highp float;

in vec3 in_position;
in vec3 in_normal;
in vec2 in_uv;
in vec3 in_tangent; 

/**
 * Varyings.
 */

out vec3 vNormalWS;
out vec2 vUv;
out vec3 fragPosition; 
out mat3 TBN; 

/**
 * Uniforms List
 */

struct Model
{
  mat4 localToProjection;
  mat4 modelMat;
};

uniform Model uModel;

void
main()
{
  vec4 worldPos = vec4(uModel.modelMat * vec4(in_position, 1.0));
  gl_Position = uModel.localToProjection * worldPos;
  vNormalWS = mat3(uModel.modelMat) * in_normal;
  fragPosition = vec3(worldPos);

  // For nomal mapping
  vec3 T = normalize(vec3(uModel.modelMat * vec4(in_tangent, 0.0))); 
  vec3 N = normalize(vec3(uModel.modelMat * vec4(in_normal, 0.0)));
  T = normalize(T - dot(T, N) * N);
  vec3 B = normalize(cross(N, T));
  TBN = mat3(T, B, N);

  vUv = in_uv;

}
`;
