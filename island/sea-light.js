// Warm sunlight and turquoise shallows layered into the existing impasto paint.
// World-space marks remain attached to the sea when the camera is resized.
export function lightPaintedSea(material) {
  const time={value:0};
  material.onBeforeCompile=shader=>{
    shader.uniforms.uSeaTime=time;
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      varying vec3 vSeaPosition;`);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vSeaPosition=(modelMatrix*vec4(position,1.0)).xyz;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vSeaPosition;
      uniform float uSeaTime;
      float seaHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec2 p=vSeaPosition.xz;
      float across=dot(p,vec2(.818,-.575));
      float along=dot(p,vec2(.575,.818));
      float paintLight=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      // Rich blue remains between loose green brush strokes.
      vec3 seaPaint=mix(vec3(paintLight),diffuseColor.rgb,1.3);
      seaPaint*=vec3(.87,1.1,1.12);
      float shallows=exp(-pow((length(p/vec2(1.,.75))-12.3)/4.5,2.));
      float greenWash=.5+.5*sin(across*.25+sin(along*.3)*1.5);
      float pigment=smoothstep(.12,.52,paintLight);
      seaPaint=mix(seaPaint,vec3(.025,.48,.25),(.06+.42*shallows+.14*greenWash)*(.35+.65*pigment));
      // A broken, meandering sun path rather than a solid yellow stripe.
      float sunCenter=9.+sin(along*.17)*2.2;
      float sunPath=exp(-pow((across-sunCenter)/5.1,2.));
      float warmRipples=smoothstep(.25,.82,.5+.5*sin(along*3.2+sin(across*.7)*1.3));
      float gold=sunPath*warmRipples*(.18+.66*pigment);
      seaPaint=mix(seaPaint,vec3(.96,.72,.19),gold*.86);
      // Small elongated paint flecks brighten and fade at independent phases.
      vec2 grid=vec2(across/.58,along/.34);
      vec2 cell=floor(grid),local=fract(grid)-.5;
      float random=seaHash(cell);
      local-=vec2(seaHash(cell+7.)-.5,seaHash(cell+19.)-.5)*.36;
      float fleck=(1.-smoothstep(.19,.42,abs(local.x)))*(1.-smoothstep(.025,.11,abs(local.y)));
      float pulse=pow(.5+.5*sin(uSeaTime*(.8+random*.8)+random*31.),5.);
      float scatter=step(.84-sunPath*.40,random);
      float glitter=fleck*scatter*(.16+.84*pulse)*(.18+.82*sunPath);
      seaPaint=mix(seaPaint,vec3(1.,.90,.48),glitter*.9);
      diffuseColor.rgb=max(seaPaint,vec3(0.));`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      totalEmissiveRadiance+=vec3(1.,.78,.24)*glitter*.7;`);
  };
  material.needsUpdate=true;
  return seconds=>{time.value=seconds;};
}
