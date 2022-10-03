export default `
precision highp float;

out vec4 outFragColor;

struct Material
{
  vec3 albedo;
  float kD; 
  float roughness;
};

uniform Material uMaterial;
uniform vec3 viewPosition; 
uniform vec3 lightPosition;

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

void
main()
{
  // **DO NOT** forget to do all your computation in linear space.
  vec3 albedo = sRGBToLinear(vec4(uMaterial.albedo, 1.0)).rgb;

  float kS = 1 - kD;

  vec3 viewDirection = normalize(fragPosition - viewPosition); 
  vec3 lightDirection = normalize(lightPosition - fragPosition);
  //outFragColor.rgba = vec4(normalize(vNormalWS), 1.0);// Show normals
  outFragColor.rgba = vec4(lightDirection, 1.0); // Show a direction

  // Diffuse 
  vec3 diffuse = uMaterial.kD * dot(vNormalWS, lightDirection) * albedo;

  // Specular
  //vec3 nDF = pow(roughness, 2) / ()

  // **DO NOT** forget to apply gamma correction as last step.
  outFragColor.rgba = LinearTosRGB(vec4(diffuse, 1.0));
}
`;
