export default `
#define M_PI 3.1415926535897932384626433832795
precision highp float;

out vec4 outFragColor;

struct Material
{
  vec3 albedo;
  float roughness;
  float metallic;
};

uniform Material uMaterial;
uniform vec3 viewPosition; 
uniform vec3 lightsPosition[4];

in vec3 vNormalWS;
in vec3 fragPosition; 

// From three.js
vec4 sRGBToLinear( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

// From three.js
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

float Gschilck(float dotprod, float k) {
  return dotprod / (dotprod * (1.0 - k) + k);
}

vec3 pbr_color(vec3 viewDirection, vec3 lightDirection, float roughness, float metallic, vec3 albedo) {
  
  // -- Diffuse -- 
  vec3 diffuse = albedo / M_PI;

  // -- Specular --
  vec3 h = normalize(lightDirection + -viewDirection); 
  float rough2 = pow(roughness, 2.0);
  // Normal Diffusion Function
  float D = max(rough2 / (M_PI * pow(pow(max(dot(vNormalWS, h), 0.0), 2.0) * (rough2 - 1.0) + 1.0, 2.0)), 0.0); 
  // Fresnel
  vec3 f0 = vec3(0.04);
  f0 = mix(f0, albedo, metallic);
  vec3 F = max(f0 + (1.0 - f0) * pow(1.0 - dot(lightDirection, vNormalWS), 5.0), 0.0);
  // G
  float dotNV = max(dot(vNormalWS, -viewDirection), 0.0);
  float dotNL = max(dot(vNormalWS, lightDirection), 0.0);
  float kDirect = pow(roughness + 1.0, 2.0) / 8.0;
  float G = max(Gschilck(dotNV, kDirect) * Gschilck(dotNL, kDirect), 0.0);

  vec3 specular = (D * F * G) / (4.0 * dotNV * dotNL);
  vec3 kD = (vec3(1.0) - F) * (1.0 - metallic);

  return (kD * diffuse + specular) * dotNL;
}

void main()
{
  // **DO NOT** forget to do all your computation in linear space.
  vec3 albedo = sRGBToLinear(vec4(uMaterial.albedo, 1.0)).rgb;

  vec3 viewDirection = normalize(fragPosition - viewPosition); 
  vec3 fragToViewDirection = normalize(viewPosition - fragPosition);

  vec3 color = vec3(0, 0, 0); 
  //for (int i = 0; i < 4; i++) {
    vec3 lightDirection = normalize(lightsPosition[0] - fragPosition);
    color += pbr_color(viewDirection, lightDirection, uMaterial.roughness, uMaterial.metallic, albedo);
  //}

  // **DO NOT** forget to apply gamma correction as last step.
  outFragColor.rgba = LinearTosRGB(vec4(color, 1.0));
}
`;
