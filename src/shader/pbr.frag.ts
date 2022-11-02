export default `
#define M_PI 3.1415926535897932384626433832795
#define lightCount 4
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
precision highp float;

out vec4 outFragColor;

struct Material
{
  vec3 albedo;
  float roughness;
  float metallic;
  bool useTextures;
  sampler2D texAlbedo; 
  sampler2D texRoughness;
  sampler2D texNormal;
};

struct PointLight  
{
  vec3 position; 
  vec3 color; 
  float intensity;
  bool isActive;
}; 

uniform Material uMaterial;
uniform vec3 viewPosition; 
uniform PointLight lights[lightCount];
uniform sampler2D diffuse_IBL; 
uniform sampler2D specular_IBL;
uniform sampler2D BRDFIntegrationMap;
uniform bool enableDiffuse;
uniform bool enableSpecular;
uniform bool enableIBLDiffuse;
uniform bool enableIBLSpecular;

in vec3 vNormalWS;
in vec3 fragPosition;
in vec2 vUv; 
in mat3 TBN;  

vec2 cartesianToPolar(vec3 n) {
    vec2 uv;
    uv.x = atan(n.z, n.x) * RECIPROCAL_PI2 + 0.5;
    uv.y = asin(n.y) * RECIPROCAL_PI + 0.5;
    return uv;
}

// From three.js
vec4 sRGBToLinear( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

// From three.js
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

float max_dot(vec3 a, vec3 b) {
  return max(dot(a, b), 0.000001);
}

float Gschilck(float dotprod, float k) {
  return dotprod / (dotprod * (1.0 - k) + k);
}

vec3 RGBMDecode(vec4 rgbm) {
  return 6.0 * rgbm.rgb * rgbm.a;
}

vec3 fresnel(vec3 normal, vec3 view, vec3 albedo, float metallic) {
  vec3 f0 = vec3(0.04);
  f0 = mix(f0, albedo, metallic);
  float tmp = clamp(1.0 - max_dot(normal, view), 0.0, 1.0);
  return (f0 + (1.0 - f0) * pow(tmp, 5.0));
}

vec3 specularIBLColor(vec3 viewDirection,vec3 normal, sampler2D specular_IBL, float l) {
  vec2 uvPolar = cartesianToPolar(reflect(viewDirection, normal));
  uvPolar.x = uvPolar.x / pow(2.0, l); 
  uvPolar.y = uvPolar.y / pow(2.0, l + 1.0) + 1.0 - 1.0 / pow(2.0, l);
  return RGBMDecode(texture(specular_IBL, uvPolar));
}

vec3 pbr_color(vec3 viewDirection, vec3 lightDirection, float roughness, float metallic, vec3 albedo, vec3 normal) {
  // -- Specular --
  vec3 h = normalize(lightDirection + -viewDirection); 
  float rough2 = pow(roughness, 2.0);
  
  // Normal Diffusion Function
  float D = rough2 / (M_PI * pow(pow(max_dot(normal, h), 2.0) * (rough2 - 1.0) + 1.0, 2.0)); 
  // Fresnel
  vec3 F = fresnel(h, -viewDirection, albedo, metallic);
  // G
  float dotNV = max_dot(normal, -viewDirection);
  float dotNL = max_dot(normal, lightDirection);
  float kDirect = pow(roughness + 1.0, 2.0) / 8.0;
  float G = Gschilck(dotNV, kDirect) * Gschilck(dotNL, kDirect);

  vec3 specular = (D * G * F) / (4.0 * dotNV * dotNL);
  specular *= float(enableSpecular);

  // -- Diffuse -- 
  vec3 diffuse = albedo / M_PI;
  vec3 kD = (vec3(1.0) - F) * (1.0 - metallic);
  diffuse *= kD * float(enableDiffuse);

  return (diffuse + specular) * dotNL;
}

void main()
{
  vec3 normal = normalize(vNormalWS); 
  float roughness = uMaterial.roughness;
  float metallic = uMaterial.metallic;
  vec3 albedo = uMaterial.albedo;

  if (uMaterial.useTextures) {
    normal = texture(uMaterial.texNormal, vUv).rgb;
    normal = normalize(normal * 2.0 - 1.0);
    normal = normalize(TBN * normal);
    albedo = texture(uMaterial.texAlbedo, vUv).rgb;
    roughness = texture(uMaterial.texRoughness, vUv).x;
  }

  // **DO NOT** forget to do all your computation in linear space.
  albedo = sRGBToLinear(vec4(albedo, 1.0)).rgb;

  vec3 viewDirection = normalize(fragPosition - viewPosition); 

  // Compute dynamic color
  vec3 radiance = vec3(0, 0, 0); 
  for (int i = 0; i < lightCount; i++) {
    vec3 lightDirection = normalize(lights[i].position.xyz - fragPosition);
    float distanceLight = length(lights[i].position.xyz - fragPosition);
    float lightIntensity = lights[i].intensity / pow(distanceLight, 2.0);
    vec3 lightColor = lightIntensity * lights[i].color * float(lights[i].isActive);

    vec3 color = pbr_color(viewDirection, lightDirection, roughness, metallic, albedo, normal);
    radiance += color * lightColor;
  }

  // IBL Diffuse
  vec3 irradiance = RGBMDecode(texture(diffuse_IBL, cartesianToPolar(normal)));
  vec3 diffuseIBL = irradiance * albedo;
  vec3 F = fresnel(normal, -viewDirection, albedo, metallic);
  vec3 kD = (vec3(1.0) - F) * (1.0 - metallic);

  // IBL Specular
  float l = 1.0;
  float maxLod = 5.0; 
  float l_min = min(float(floor(roughness * maxLod)), maxLod - 1.0);
  float blendForce = maxLod * roughness - l_min;
  vec3 minEnvColor = specularIBLColor(viewDirection, normal, specular_IBL, l_min); 
  vec3 maxEnvColor = specularIBLColor(viewDirection, normal, specular_IBL, l_min + 1.0);
  vec3 envColor = mix(minEnvColor, maxEnvColor, blendForce);
  vec2 envBRDF = texture(BRDFIntegrationMap, vec2(clamp(dot(normal, viewDirection), 0.001, 1.0), roughness)).xy;
  vec3 specularIBL = envColor;
  specularIBL = envColor * (F * envBRDF.x + envBRDF.y);
  
  vec3 ambient = (kD * diffuseIBL * float(enableIBLDiffuse) + specularIBL * float(enableIBLSpecular)) ;
  radiance += ambient; 

  // **DO NOT** forget to apply gamma correction as last step.
  outFragColor.rgba = LinearTosRGB(vec4(radiance, 1.0));
}
`;
