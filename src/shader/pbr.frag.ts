export default `
#define M_PI 3.1415926535897932384626433832795
#define lightCount 4
precision highp float;

out vec4 outFragColor;

struct Material
{
  vec3 albedo;
  float roughness;
  float metallic;
};

struct PointLight  
{
  vec3 position; 
  vec3 color; 
}; 

uniform Material uMaterial;
uniform vec3 viewPosition; 
uniform PointLight lights[4];

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
  // -- Specular --
  vec3 h = max(normalize(lightDirection + -viewDirection), 0.0); 
  float rough2 = pow(roughness, 2.0);
  // Normal Diffusion Function
  float D = max(rough2 / (M_PI * pow(pow(max(dot(vNormalWS, h), 0.0), 2.0) * (rough2 - 1.0) + 1.0, 2.0)), 0.0); 
  // Fresnel
  vec3 f0 = vec3(0.04);//vec3(0.04);
  f0 = mix(f0, albedo, metallic);
  vec3 F = (f0 + (1.0 - f0) * pow(1.0 - max(dot(-viewDirection, h), 0.0), 5.0)) * vec3(1.0, 1.0, 1.0);
  // G
  float dotNV = max(dot(vNormalWS, h), 0.0);
  float cosTheta = max(dot(lightDirection, h), 0.0);
  float kDirect = roughness;
  float G = max(Gschilck(dotNV, kDirect) * Gschilck(cosTheta, kDirect), 0.0);

  float specular = (D * G) / (4.0 * dotNV * cosTheta);

  // -- Diffuse -- 
  vec3 diffuse = (1.0 - F) * albedo / M_PI;
  float kD = (1.0 - metallic);

  return G * vec3(1.0, 1.0, 1.0);//(kD * diffuse + F * specular) * cosTheta;
}

void main()
{
  // **DO NOT** forget to do all your computation in linear space.
  vec3 albedo = sRGBToLinear(vec4(uMaterial.albedo, 1.0)).rgb;

  vec3 viewDirection = normalize(fragPosition - viewPosition); 
  vec3 fragToViewDirection = normalize(viewPosition - fragPosition);

  vec3 radiance = vec3(0, 0, 0); 
  //for (int i = 0; i < lightCount; i++) {
    vec3 lightDirection = normalize(lights[0].position.xyz - fragPosition);
    float lightIntensity = 1.0 / pow(length(lights[0].position.xyz - fragPosition), 2.0);
    vec3 radianceLight = pbr_color(viewDirection, lightDirection, uMaterial.roughness, uMaterial.metallic, albedo);
    //if (radianceLight[0] + radianceLight[1] + radianceLight[2] > 0.0)
    radiance += lightIntensity * radianceLight ;
  //}

  // **DO NOT** forget to apply gamma correction as last step.
  outFragColor.rgba = LinearTosRGB(vec4(radiance, 1.0));
}
`;
