import * as THREE from './vendor/three.module.js';
import { pigment, meadow, sand, waterFallback } from './painterly.js';
import { lightPaintedSea } from './sea-light.js';
import { createIslandMusic } from './music.js';

const $ = s => document.querySelector(s);
const world = $('#world'), panel = $('#panel'), content = $('#panel-content');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let seed = 81;
const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const scene = new THREE.Scene();
scene.background = new THREE.Color('#8aacbf');
scene.fog = new THREE.Fog('#8aacbf', 48, 105);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (_) {
  $('#loading').className = 'failed';
  $('#loading').innerHTML = 'This browser could not open the 3D island.<br><a href="../">Explore the full homepage instead →</a>';
  throw new Error('WebGL renderer unavailable');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
world.appendChild(renderer.domElement);
const camera = new THREE.OrthographicCamera(-22, 22, 14, -14, .1, 150);
camera.position.set(19, 26.7, 28); camera.lookAt(0, 1.7, 1);
let zoom = 1;
const hemi = new THREE.HemisphereLight('#fff7de', '#7291b2', 1.9); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0cc', 2.4); sun.position.set(-12, 24, 12);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left:-18,right:18,top:18,bottom:-18,near:.5,far:65});
sun.shadow.bias = -.0005; sun.shadow.normalBias = .025; scene.add(sun);
const materials = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, map:pigment, bumpMap:pigment, bumpScale:.045, roughness: 1, flatShading: false, ...opts }));
  return materials.get(key);
}
function mesh(geo, color, x=0,y=0,z=0, parent=scene, opts={}) {
  const m = new THREE.Mesh(geo, mat(color,opts)); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
}
function box(w,h,d,color,x=0,y=0,z=0,parent=scene){return mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent);}
function ball(r,color,x,y,z,parent=scene,detail=2){return mesh(new THREE.IcosahedronGeometry(r,detail),color,x,y,z,parent);}
function cylinder(rt,rb,h,color,x,y,z,parent=scene,n=12){return mesh(new THREE.CylinderGeometry(rt,rb,h,n),color,x,y,z,parent);}
function group(x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);return g;}
const obstacles=[];
function obstacle(x,z,r){obstacles.push({x,z,r});}
function disc(r,color,x,y,z,sx=1,sz=1){const m=cylinder(r,r,.035,color,x,y,z,scene,48);m.scale.set(sx,1,sz);return m;}

// A limestone headland rising toward a small Mediterranean village.
function terrainHeight(x,z){
 const t=THREE.MathUtils.clamp((1-z)/8,0,1);
 const hillside=t*t*(3-2*t)*(2.7+.45*Math.cos(x*.3));
 const musicTerrace=.42*Math.exp(-((x+5)**2/10+(z-3.4)**2/7));
 return hillside+musicTerrace;
}
function coastRadius(a){return 1+.045*Math.sin(a*5)+.028*Math.cos(a*9)+.025*Math.sin(a*3+.8);}
function coastalGround(){
 const vertices=[],uv=[],indices=[],sectors=100,rings=20;
 vertices.push(0,terrainHeight(0,0)+.15,0);uv.push(.5,.5);
 for(let j=1;j<=rings;j++)for(let i=0;i<sectors;i++){
  const a=i/sectors*Math.PI*2,r=j/rings,k=coastRadius(a),x=Math.cos(a)*11.15*k*r,z=Math.sin(a)*8.35*k*r;
  vertices.push(x,terrainHeight(x,z)+.15,z);uv.push(x/22+.5,z/17+.5);
 }
 for(let i=0;i<sectors;i++)indices.push(0,1+(i+1)%sectors,1+i);
 for(let j=1;j<rings;j++)for(let i=0;i<sectors;i++){const a=1+(j-1)*sectors+i,b=1+(j-1)*sectors+(i+1)%sectors,c=a+sectors,d=b+sectors;indices.push(a,b,c,b,d,c);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 return mesh(geo,'#f7ebcb',0,0,0,scene,{map:sand,bumpMap:sand,bumpScale:.06});
}
const water=mesh(new THREE.PlaneGeometry(240,240),'#ffffff',0,-.82,0,scene,{map:waterFallback,bumpMap:waterFallback,bumpScale:.12,roughness:1,metalness:0});water.rotation.x=-Math.PI/2;water.castShadow=false;
const updateSeaLight=lightPaintedSea(water.material);
new THREE.TextureLoader().load('./assets/oil-sea.png',texture=>{
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(10,10);texture.center.set(.5,.5);texture.rotation=.61;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 water.material.map=texture;water.material.bumpMap=texture;water.material.bumpScale=.08;water.material.needsUpdate=true;
});
const terrain=coastalGround();
// Loose flowering shrubs, rather than solid circles of grass.
const gardenSpots=[[-3.5,1.3,.9,.6],[2.4,.1,1.1,.8],[6.8,.5,.65,1.1],[-8.2,1,.6,.8],[-2.6,-4.5,.5,.9],[1.2,-5,.5,.8],[1,5.2,.9,.5]];
const shrubTransform=new THREE.Object3D();
for(let colorIndex=0;colorIndex<4;colorIndex++){
 const shrubs=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),mat(['#7f9064','#a0a077','#c3a4c7','#eddbb1'][colorIndex]),gardenSpots.length*10);
 let index=0;for(const [cx,cz,rx,rz] of gardenSpots)for(let i=0;i<10;i++){
  const a=random()*Math.PI*2,r=Math.sqrt(random()),x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r,size=colorIndex<2?.1+random()*.12:.055+random()*.04;
  shrubTransform.position.set(x,terrainHeight(x,z)+.18+size,z);shrubTransform.scale.set(size*1.4,size,size);shrubTransform.rotation.y=a;shrubTransform.updateMatrix();shrubs.setMatrixAt(index++,shrubTransform.matrix);
 }scene.add(shrubs);
}
// Angular pale rocks break the perimeter into coves and limestone faces.
for(let i=0;i<100;i++){
 const a=i/100*Math.PI*2,k=coastRadius(a),x=Math.cos(a)*11*k,z=Math.sin(a)*8.25*k;
 if(x>4.5&&x<6.9&&z>5.5)continue;
 const h=terrainHeight(x,z),r=.52+random()*.42;
 const cliff=ball(r,['#ead4a9','#f7e8c3','#ccba96','#a4b3b0','#e5c993'][i%5],x,h*.45-.23,z,scene,0);
 cliff.scale.set(1.35,(h+.95)/(r*1.65),1);cliff.rotation.y=a;
 const cap=ball(r*.85,['#fff0d0','#e8d4a8','#d4c298'][i%3],x,h+.01,z,scene,0);cap.scale.set(1.2,.5,1);
 if(i%3===0){const skerry=ball(.35+random()*.35,'#dbc9a6',x*1.075,-.55,z*1.075,scene,0);skerry.scale.set(1.5,.6,1);}
}
// Broken shore marks interrupt the otherwise geometric waterline.
const foamGeo=new THREE.PlaneGeometry(1,1),foamMat=new THREE.MeshStandardMaterial({color:'#e6edcf',map:pigment,roughness:1,side:THREE.DoubleSide});
const foam=new THREE.InstancedMesh(foamGeo,foamMat,190),foamTransform=new THREE.Object3D();
for(let i=0;i<190;i++){const a=i/190*Math.PI*2,r=11.3*coastRadius(a)+random()*.45;
 foamTransform.position.set(Math.cos(a)*r,-.72,Math.sin(a)*r*.75);
 foamTransform.rotation.set(-Math.PI/2,0,-a-Math.PI/2+(random()-.5)*.35);foamTransform.scale.set(.16+random()*.52,.025+random()*.1,1);foamTransform.updateMatrix();foam.setMatrixAt(i,foamTransform.matrix);}
scene.add(foam);
const ripples=[];
for(let i=0;i<96;i++){
 const a=random()*Math.PI*2,r=12+random()*23;
 const g=box(.35+random()*.9,.012,.045,'#c0e2d8',Math.cos(a)*r,-.78,Math.sin(a)*r*.85);
 g.rotation.y=random()*.2;g.castShadow=false;ripples.push(g);
}
const landContentStart=scene.children.length;
// Narrow stone lanes follow the hillside contours.
function path(ax,az,bx,bz,width=1.15){
 const dx=bx-ax,dz=bz-az,length=Math.hypot(dx,dz),n=Math.ceil(length/.32);
 for(let i=0;i<n;i++){const t=(i+.5)/n,x=ax+dx*t,z=az+dz*t,segment=box(width,.045,length/n+.025,i%3?'#eee0be':'#e5d6b3',x,.2,z);
 segment.rotation.order='YXZ';segment.rotation.y=Math.atan2(dx,dz);
 const dh=terrainHeight(ax+dx*(i+1)/n,az+dz*(i+1)/n)-terrainHeight(ax+dx*i/n,az+dz*i/n);segment.rotation.x=-Math.atan2(dh,length/n);
 }
}
path(0,4,0,-1,1.35);path(0,-1,-5,-1);path(0,-1,4,-2);path(0,3,-5,3.5);path(0,4,5.7,6.5);path(5.7,6.5,5.7,8.5);
// Stepping stones and plant beds.
for(let i=0;i<9;i++)disc(.21,'#f8ebca',-1.1+i*.26,.23,1.7+Math.sin(i)*.04,1,.6);
function tree(x,z,s=1){const g=group(x,.17,z);cylinder(.09*s,.17*s,1.4*s,'#877453',0,.65*s,0,g,7);
 for(let i=0;i<13;i++){const a=i*2.4,r=.18+random()*.65;const crown=ball((.25+random()*.17)*s,['#63805c','#87955e','#a0a56c','#536f5c'][i%4],Math.cos(a)*r*s,(1.45+random()*.48)*s,Math.sin(a)*r*s,g,1);crown.scale.y=.8;}
 obstacle(x,z,.5*s);return g;}

[[-8,-1,.9],[-8.2,-4,.9],[-6.9,-6,.8],[-3.5,-5.8,1.15],[0,-6.5,1],[7.5,-3.6,1],[8.7,-1.2,.9],[7.9,1.2,.75],[-8,3.4,.85],[-6.9,5.2,.65],[-2,6.5,.7]].forEach(a=>tree(...a));
for(let i=0;i<52;i++){
 const a=random()*Math.PI*2,r=9+random()*1.6;const x=Math.cos(a)*r,z=Math.sin(a)*r*.71;
 if(x>3&&z>5)continue;
 if(i%3===0){const rock=ball(.22+random()*.3,['#b5c0b0','#c9c7ae','#a4b9ad'][i%3],x,.2,z);rock.scale.y=.65;}
 else{for(let j=0;j<3;j++){const fx=x+(random()-.5)*.35,fz=z+(random()-.5)*.3;cylinder(.015,.018,.26,'#67916e',fx,.28,fz,scene,5);ball(.07,['#f3d373','#eab4a8','#d1c3df'][i%3],fx,.44,fz,scene,0);}}
}
function roof(parent,w,d,h,color,y){const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,h);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});const m=mesh(geo,color,0,y,-d/2,parent);return m;}
function cottage(x,z,roofColor,wallColor,scale=1){
 const g=group(x,.2,z);g.scale.setScalar(scale);
 box(3,3.4,2.5,wallColor,0,1.7,0,g);roof(g,3.35,2.85,.55,roofColor,3.4);
 // Shallow rows of roof tiles, blue shutters, and a little iron balcony.
 for(let i=0;i<12;i++){const tx=-1.57+i*.285;box(.035,.035,2.83,'#dda36e',tx,3.42+(.55*(1-Math.abs(tx)/1.67)),0,g);}
 box(.7,1.36,.07,'#557e88',0,.7,1.285,g);ball(.035,'#c9a45d',.21,.74,1.34,g,0);
 for(const y of [1.12,2.55])for(const wx of [-.94,.94]){
  box(.53,.83,.1,'#fcf0d2',wx,y,1.3,g);box(.37,.67,.04,'#577b90',wx,y,1.365,g);
  for(const dx of [-.33,.33]){box(.19,.78,.05,'#8caaa5',wx+dx,y,1.35,g);for(let j=0;j<5;j++)box(.17,.014,.017,'#6f9390',wx+dx,y-.28+j*.13,1.39,g);}
  box(.035,.7,.03,'#f6e7c7',wx,y,1.4,g);box(.42,.04,.03,'#f6e7c7',wx,y,1.4,g);
 }
 box(2.75,.1,.48,'#e4d4b1',0,2.05,1.44,g);box(2.7,.035,.035,'#667a77',0,2.4,1.66,g);
 for(let i=0;i<13;i++)box(.024,.35,.024,'#667a77',-1.3+i*.216,2.22,1.66,g);
 box(1.1,.12,.6,'#e1d2b0',0,.075,1.5,g);box(.32,.62,.35,'#ecdfc0',.93,3.65,-.15,g);
 obstacle(x,z,1.82*scale);return g;
}
const library=cottage(-5,-3.3,'#d18a43','#fff0c9');
// A sign with three tiny book spines.
box(.8,.1,.5,'#aa815b',-5,.85,-1.45);[-.25,0,.25].forEach((x,i)=>box(.14,.42,.32,['#608a9a','#dbb36e','#8db394'][i],-5+x,1.09,-1.45));
const lab=cottage(4,-3.6,'#c98141','#fff0d3');
// Smaller houses gather behind the two public destinations.
cottage(-4.3,-6.1,'#bb885d','#fff2d9',.57);
cottage(2.6,-6.15,'#c49a70','#ead69e',.6);
cottage(-7.6,-4.6,'#c18a57','#efd997',.5);
// Telescope at the workshop.
const telescope=group(6.1,.2,-2.9);cylinder(.08,.08,1.15,'#ac9676',0,.58,0,telescope,8);
const tube=cylinder(.19,.23,1,'#d9e8e7',0,1.2,0,telescope,12);tube.rotation.z=-.8;
for(let i=0;i<3;i++){const leg=box(.08,.85,.08,'#657f80',Math.cos(i*2.09)*.2,.4,Math.sin(i*2.09)*.2,telescope);leg.rotation.z=Math.cos(i*2.09)*.4;leg.rotation.x=Math.sin(i*2.09)*.4;}
// Slender cypresses echo the coastal painting's silhouettes.
for(const [x,z,h] of [[-8.5,-3.5,3.5],[-6.5,-5.8,3.8],[1,-6.4,3.2]]){
 const g=group(x,.15,z);cylinder(.08,.12,h*.7,'#8a714c',0,h*.35,0,g,7);
 for(let j=0;j<3;j++){const crown=ball(.46,'#426a49',0,h*.45+j*h*.18,0,g,2);crown.scale.set(1,2.1-j*.2,.86);}
 obstacle(x,z,.48);
}
// The piano garden: tiled patio, pergola, keyboard and seat.
box(4.3,.17,3.3,'#f5e5c0',-5,.18,3.4);
for(let i=0;i<12;i++){const x=-7.1+i*.38;box(.34,.5,.25,'#f5e5c0',x,.43,2.05);}
for(let i=0;i<8;i++)box(.25,.5,.35,'#e5d4b2',-7.12,.43,2.2+i*.37);
const piano=group(-5,.23,3.4);piano.scale.set(1.12,1.08,1.06);box(1.75,1.1,.65,'#537d81',0,.69,0,piano);box(1.9,.15,.84,'#375864',0,1.3,0,piano);box(1.75,.13,.52,'#f7f0dc',0,.76,.56,piano);
for(let i=0;i<12;i++){box(.015,.015,.48,'#bcb8a8',-.8+i*.145,.835,.56,piano);if(![2,6,9].includes(i))box(.065,.07,.24,'#2b4550',-.76+i*.145,.865,.45,piano);}
box(.95,.12,.45,'#b9916c',0,.42,1.16,piano);[-.37,.37].forEach(x=>box(.07,.42,.3,'#92775d',x,.2,1.16,piano));
[-1.5,1.5].forEach(x=>{box(.11,2.25,.11,'#ecdfbc',-5+x,1.32,2.6);box(.11,2.25,.11,'#ecdfbc',-5+x,1.32,4.6);});
for(let i=0;i<6;i++)box(3.3,.1,.12,'#e9d7af',-5,2.47,2.4+i*.47);
for(let i=0;i<18;i++){const x=-6.5+(i>7?(i-7)*.29:0),y=i<8?.6+i*.26:2.56,z=2.6;ball(.23,'#71835c',x,y,z);for(let j=0;j<3;j++)ball(.085,['#ad88b3','#c7a5c9','#ddc0d6'][j],x+(random()-.5)*.3,y+.11,z+.13,scene,1);}
// Open sheet music and climbing flowers make this a music corner.
box(.66,.42,.05,'#fff8dc',0,1.34,.36,piano);
for(let i=0;i<5;i++)box(.5,.012,.013,'#627b82',0,1.23+i*.045,.39,piano);
for(let i=0;i<28;i++){
 const a=i*2.4,x=-5+Math.cos(a)*1.85,z=3.4+Math.sin(a)*1.55;
 if(z>4.4&&x>-5.5)continue;
 cylinder(.018,.022,.32,'#638351',x,.38,z,scene,5);
 for(let j=0;j<3;j++)ball(.085,['#ddad87','#dfc86e','#b3a4c6','#f3e6bc'][i%4],x+Math.cos(j*2.1)*.07,.56,z+Math.sin(j*2.1)*.07,scene,1);
}
obstacle(-5,3.4,1.1);
// Pier, mailbox, mooring posts and a little sailboat.
for(let i=0;i<20;i++)box(2,.14,.29,i%2?'#c7a275':'#d6b486',5.7,.15,6+i*.31);
[6.2,8,10,11.8].forEach(z=>[-.95,.95].forEach(dx=>{cylinder(.08,.1,1.2,'#977454',5.7+dx,-.1,z,scene,8);cylinder(.105,.105,.08,'#f4e6c8',5.7+dx,.53,z,scene,8);}));
const mailbox=group(5.7,.22,8.8);box(.13,1.25,.13,'#e4d2a6',0,.62,0,mailbox);box(.74,.52,.6,'#f0c975',0,1.37,0,mailbox);roof(mailbox,.87,.72,.25,'#638c9a',1.63);box(.46,.045,.015,'#725f48',0,1.46,.31,mailbox);obstacle(5.7,8.8,.55);
const boat=group(9.6,-.4,7.2);const hull=ball(1,'#fff2ce',0,0,0,boat);hull.scale.set(.7,.3,1.55);cylinder(.045,.045,2.7,'#b49365',0,1.15,0,boat,8);const sailShape=new THREE.Shape();sailShape.moveTo(.08,0);sailShape.lineTo(.08,2);sailShape.lineTo(1.25,.08);sailShape.closePath();mesh(new THREE.ShapeGeometry(sailShape),'#faf2d5',0,.45,0,boat,{side:THREE.DoubleSide});boat.rotation.y=-.4;
// A small lighthouse on the quiet tip of the island.
const light=group(-1.5,.2,-6.2);cylinder(.45,.65,3.2,'#fff1d0',0,1.6,0,light,12);cylinder(.51,.54,.42,'#88aeb7',0,2.55,0,light,12);cylinder(.52,.52,.53,'#ffe5a0',0,3.43,0,light,8);mesh(new THREE.ConeGeometry(.75,.6,8),'#557e93',0,3.97,0,light);obstacle(-1.5,-6.2,.75);
// Props, houses, and vegetation sit on the same surface used by movement.
for(const object of scene.children.slice(landContentStart)){if(object!==boat)object.position.y+=terrainHeight(object.position.x,object.position.z);}
// Small explorer and robot companion.
const player=group(0,.23,3.4);player.name='Explorer';
const body=mesh(new THREE.CapsuleGeometry(.23,.39,4,8),'#eecb75',0,.68,0,player);
const head=ball(.25,'#efc6a3',0,1.2,0,player,2);
const hair=ball(.265,'#3b4650',0,1.27,-.06,player,1);hair.scale.set(1,.85,.83);
box(.35,.11,.33,'#7099a5',0,1.48,0,player);
const legs=[-.12,.12].map(x=>box(.14,.4,.16,'#4b7183',x,.26,0,player));
[-.31,.31].forEach(x=>box(.12,.4,.13,'#efc6a3',x,.72,0,player));
const robot=group(.9,.7,4.1);box(.43,.37,.35,'#edf0d5',0,0,0,robot);box(.31,.14,.03,'#537f8b',0,.02,.19,robot);[-.09,.09].forEach(x=>ball(.035,'#f4dda0',x,.025,.215,robot));cylinder(.022,.022,.18,'#769796',0,.27,0,robot,6);ball(.052,'#efd58a',0,.38,0,robot);cylinder(.15,.15,.08,'#83aca9',0,-.25,0,robot,10);
const ring=mesh(new THREE.RingGeometry(.43,.49,32),'#fffbce',0,.235,3.4,scene,{side:THREE.DoubleSide});ring.rotation.x=-Math.PI/2;ring.castShadow=false;
const destinationRing=mesh(new THREE.RingGeometry(.2,.26,24),'#fdf5d1',0,.245,0,scene,{side:THREE.DoubleSide});destinationRing.rotation.x=-Math.PI/2;destinationRing.visible=false;
// Scene labels are ordinary accessible buttons, projected from 3D anchors.
const places=[
 {id:'library',label:'Seaside library',number:'01',x:-5,z:-3.3,anchorY:4.6,tx:-5,tz:-1.3,title:'A little about Bo'},
 {id:'workshop',label:'Research workshop',number:'02',x:4,z:-3.6,anchorY:4.6,tx:4,tz:-1.6,title:'Inside the workshop'},
 {id:'piano',label:'Piano garden',number:'03',x:-5,z:3.4,anchorY:2.9,tx:-4.6,tz:5.1,title:'A few notes, off the clock'},
 {id:'mailbox',label:'Harbor post',number:'04',x:5.7,z:8.8,anchorY:2.3,tx:5.7,tz:7.7,title:'Say hello'}
];
const noteInfo=[
 {id:'agents',title:'Agents that keep learning',topic:'AGENTS',text:'I’m interested in capable, self-improving AI agents: systems that can develop stronger abilities through experience and scalable self-improvement.',x:-1.8,z:-2.4,color:'#8ed0c0'},
 {id:'data',title:'The data behind the model',topic:'DATA',text:'How does data shape the capabilities of foundation models? My interests include dataset curation, multimodal understanding and generation, and benchmarks that reveal emergent abilities.',x:3,z:2.5,color:'#8ec1de'},
 {id:'research',title:'AI as a research partner',topic:'AI FOR RESEARCH',text:'Recently, I’ve become especially interested in how AI can accelerate research itself—from exploring ideas and forming hypotheses to designing experiments and discovering new insights.',x:-1.7,z:5.5,color:'#e2bd87'}
];
let saved=[];try{saved=JSON.parse(localStorage.getItem('bo-island-notes')||'[]');}catch(_){}
const found=new Set(Array.isArray(saved)?saved.filter(id=>noteInfo.some(n=>n.id===id)):[]);
function makePin(item,kind){const b=document.createElement('button');b.className='pin'+(kind==='note'?' page':'');b.setAttribute('aria-label',kind==='note'?'Find field note: '+item.topic:'Visit '+item.label);b.innerHTML=kind==='note'?'✧':`<small>${item.number}</small>${item.label}`;$('#pins').appendChild(b);b.addEventListener('click',()=>travel(item,kind));return b;}
places.forEach(p=>{p.anchorY+=terrainHeight(p.x,p.z);p.el=makePin(p,'place');});
noteInfo.forEach(n=>{n.el=makePin(n,'note');n.anchorY=1.9+terrainHeight(n.x,n.z);n.mesh=group(n.x,1.0+terrainHeight(n.x,n.z),n.z);const paper=box(.5,.63,.045,'#fff4ce',0,0,0,n.mesh);paper.rotation.x=-.25;for(let i=0;i<3;i++)box(.29-i*.04,.022,.025,n.color,-.03,.1-i*.11,.04,n.mesh);const halo=mesh(new THREE.RingGeometry(.42,.46,24),n.color,0,-.61,0,n.mesh,{side:THREE.DoubleSide});halo.rotation.x=-Math.PI/2;});
function syncNotes(){noteInfo.forEach(n=>{n.mesh.visible=!found.has(n.id);n.el.hidden=found.has(n.id);});$('#progress').textContent=found.size+' / 3';}
syncNotes();
const keys=new Set();let route=[],arrival=null,near=null,lastTime=0,walkPhase=0,toastTimer;
let lastFocus=null,audioContext;
const getAudioContext=()=>audioContext??=new(window.AudioContext||window.webkitAudioContext)();
const music=createIslandMusic({button:$('#music-toggle'),slider:$('#music-volume'),getContext:getAudioContext,onError:()=>toast('Audio could not start. Try the music button again.')});
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3800);}
function hideWelcome(){$('#welcome').classList.add('hidden');}
$('#dismiss-welcome').addEventListener('click',()=>{hideWelcome();world.focus();toast('Follow the paths. Pick up the three glowing pages.');});
function openPanel(html){keys.clear();route=[];arrival=null;destinationRing.visible=false;lastFocus=document.activeElement;content.innerHTML=html;music.setDucked(!!content.querySelector('.piano-keys'));if(!panel.open)panel.showModal();$('.close').focus();}
function closePanel(){panel.close();keys.clear();if(lastFocus?.isConnected)lastFocus.focus();else world.focus();}
$('.close').addEventListener('click',closePanel);panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel();}});
panel.addEventListener('close',()=>{keys.clear();music.setDucked(false);});
function header(kicker,title){return `<span class="eyebrow">${kicker}</span><h2>${title}</h2>`;}
function showPlace(p){hideWelcome();
 if(p.id==='library')openPanel(header('01 / SEASIDE LIBRARY','Hi, I’m Bo.')+`<img class="panel-photo" src="../assets/bo-li-graduation.png" alt="Bo Li in graduation attire"><p>I’m an MSCS student at <strong>UIUC</strong>. I completed my undergraduate degree at <strong>Fudan University</strong>.</p><p>Previously, I was a research intern at Princeton University, advised by <a href="https://liuzhuang13.github.io/">Zhuang Liu</a> and <a href="https://zeyofu.github.io/">Xingyu Fu</a>, working closely with Yida Yin and Wenhao Chai. I also worked with Huaxiu Yao at UNC-Chapel Hill and Jingjing Chen at Fudan.</p><p>I work on self-improving agents, data for foundation models, and AI that helps accelerate research.</p><div class="panel-actions"><a class="action" href="../#about">Read my full story ↗</a></div>`);
 if(p.id==='workshop')openPanel(header('02 / RESEARCH WORKSHOP','Ideas, built together.')+`<article><span class="tag">ECCV 2026</span><h3>UEval: A Benchmark for Unified Multimodal Generation</h3><p>Bo Li, Yida Yin, Wenhao Chai, Xingyu Fu*, Zhuang Liu*</p><div class="links"><a href="https://arxiv.org/pdf/2601.22155" target="_blank" rel="noopener">Paper ↗</a><a href="https://zlab-princeton.github.io/UEval/" target="_blank" rel="noopener">Project ↗</a><a href="https://github.com/zlab-princeton/UEval" target="_blank" rel="noopener">Code ↗</a></div></article><article><span class="tag">FINDINGS OF EMNLP 2026</span><h3>GUI Agents for Continual Game Generation</h3><p>Yixu Huang*, Bo Li*, Na Li*, et al.</p><div class="links"><a href="https://arxiv.org/abs/2605.28258" target="_blank" rel="noopener">Paper ↗</a><a href="https://continual-game-generation.vercel.app/" target="_blank" rel="noopener">Project ↗</a></div></article><article><span class="tag">ICLR 2025</span><h3>Anyprefer: An Agentic Framework For Preference Data Synthesis</h3><p>Yiyang Zhou*, Zhaoyang Wang*, Tianle Wang*, et al., including Bo Li.</p><div class="links"><a href="https://arxiv.org/pdf/2504.19276" target="_blank" rel="noopener">Paper ↗</a><a href="../#research">Full publication list ↗</a></div></article>`);
 if(p.id==='piano'){openPanel(header('03 / PIANO GARDEN','A little music by the sea.')+`<p>I enjoy playing the piano, used to play the guitar, and spend time in Genshin Impact and Zenless Zone Zero. I’d love to see more of the world, too.</p><div class="piano-keys" aria-label="Playable piano">${['C','D','E','F','G','A','B'].map((n,i)=>`<button data-note="${i}" aria-label="Play ${n}">${n}<br>${i+1}</button>`).join('')}</div><p class="piano-caption">Tap a key, or play with 1–7. Sound plays only when you press a key.</p>`);content.querySelectorAll('[data-note]').forEach(b=>b.addEventListener('click',()=>playNote(+b.dataset.note)));}
 if(p.id==='mailbox')openPanel(header('04 / HARBOR POST','Let’s exchange ideas.')+`<p>I’m open to internships and collaborations in VLMs, agents, evaluation, and AI for research.</p><p>If you’re a junior undergraduate, I’m also happy to chat about applications, summer research, and life or career planning.</p><div class="panel-actions"><a class="action" href="mailto:bol8@illinois.edu">Email Bo ↗</a></div><div class="links"><a href="https://scholar.google.com/citations?hl=en&user=X8H6V5IAAAAJ" target="_blank" rel="noopener">Scholar ↗</a><a href="https://github.com/primerL" target="_blank" rel="noopener">GitHub ↗</a><a href="https://x.com/BoLi81501" target="_blank" rel="noopener">X ↗</a></div><p><a href="mailto:bettyli2332@gmail.com">bettyli2332@gmail.com</a></p>`);
}
function playNote(i){if(i<0||i>6)return;try{getAudioContext();audioContext.resume();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='triangle';osc.frequency.value=[261.63,293.66,329.63,349.23,392,440,493.88][i];gain.gain.setValueAtTime(0,audioContext.currentTime);gain.gain.linearRampToValueAtTime(.15,audioContext.currentTime+.012);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+1.2);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+1.25);const b=content.querySelector(`[data-note="${i}"]`);b?.classList.add('playing');if(b&&!reduced){const note=document.createElement('span');note.className='music-note';note.textContent=i%2?'♪':'♫';note.style.left=(12+i*11)+'%';content.querySelector('.piano-keys')?.appendChild(note);setTimeout(()=>note.remove(),1400);}setTimeout(()=>b?.classList.remove('playing'),180);}catch(_){toast('Audio is not available in this browser.');}}
function collect(n){if(found.has(n.id))return;found.add(n.id);try{localStorage.setItem('bo-island-notes',JSON.stringify([...found]));}catch(_){}syncNotes();openPanel(header(`FIELD NOTE ${found.size} / 3 · ${n.topic}`,n.title)+`<p>${n.text}</p>${found.size===3?'<p><strong>You found all three pages.</strong> Thanks for getting to know my little corner of research. There’s still music to play and a sea view to enjoy.</p>':''}<div class="panel-actions"><button class="action" id="keep-exploring">Keep exploring →</button><button class="action secondary" id="view-notes">Notebook</button></div>`);$('#keep-exploring').onclick=closePanel;$('#view-notes').onclick=showNotebook;if(found.size===3){celebrationUntil=performance.now()+5000;toast('Notebook complete. All three ideas are yours to keep.');}}
function showNotebook(){openPanel(header('YOUR FIELD NOTEBOOK',found.size===3?'Three pages. Many possibilities.':'A few ideas to collect.')+`<p>Find the glowing pages around the island. Your discoveries are saved on this browser.</p><div class="notebook-list">${noteInfo.map(n=>`<div class="note-slot ${found.has(n.id)?'found':''}"><strong>${found.has(n.id)?'✓ '+n.title:'◇ '+n.topic}</strong><p>${found.has(n.id)?n.text:'Still waiting somewhere on the island.'}</p></div>`).join('')}</div><div class="panel-actions"><button class="action secondary" id="restart">Collect again</button></div>`);$('#restart').onclick=()=>{found.clear();try{localStorage.removeItem('bo-island-notes');}catch(_){}syncNotes();showNotebook();};}
$('#notebook').onclick=showNotebook;
$('#help').onclick=()=>{openPanel(header('A LITTLE ISLAND GUIDE','Find your way.')+`<p>Walk with <strong>WASD / arrow keys</strong>, or click a clear patch of ground. Select a sign to walk to that place. Press <strong>E</strong> near a location or a glowing page to interact.</p><p>Prefer to read directly? All four places are available here.</p><div class="destinations">${places.map(p=>`<button data-place="${p.id}">${p.label}<span>${p.title}</span></button>`).join('')}</div>`);content.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>showPlace(places.find(p=>p.id===b.dataset.place)));};

// Keep navigation on land, clear of the cottages and trees.
function walkable(x,z){return ((x/10.45)**2+(z/7.75)**2<Math.min(1,coastRadius(Math.atan2(z/8.35,x/11.15)))**2||(x>4.95&&x<6.45&&z>5&&z<11.5))&&!obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.22);}
const step=.4, grid=[];
for(let ix=0;ix<=55;ix++)for(let iz=0;iz<=50;iz++){const x=-11+ix*step,z=-8+iz*step;if(walkable(x,z))grid.push({ix,iz,x,z,id:ix+','+iz});}
const cells=new Map(grid.map(n=>[n.id,n]));
function nearestCell(x,z){return grid.reduce((a,b)=>Math.hypot(b.x-x,b.z-z)<Math.hypot(a.x-x,a.z-z)?b:a);}
function pathTo(x,z){
 const start=nearestCell(player.position.x,player.position.z),goal=nearestCell(x,z),open=new Set([start.id]),came=new Map(),cost=new Map([[start.id,0]]),estimate=new Map([[start.id,0]]);
 while(open.size){let id=[...open].reduce((a,b)=>(estimate.get(a)??Infinity)<(estimate.get(b)??Infinity)?a:b),n=cells.get(id);
  if(id===goal.id){const result=[goal];while(came.has(id)){id=came.get(id);result.unshift(cells.get(id));}return result;}
  open.delete(id);
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
   if(!dx&&!dz)continue;const m=cells.get((n.ix+dx)+','+(n.iz+dz));if(!m)continue;
   if(dx&&dz&&(!cells.has((n.ix+dx)+','+n.iz)||!cells.has(n.ix+','+(n.iz+dz))))continue;
   const next=cost.get(n.id)+Math.hypot(dx,dz);
   if(next<(cost.get(m.id)??Infinity)){came.set(m.id,n.id);cost.set(m.id,next);estimate.set(m.id,next+Math.hypot(m.ix-goal.ix,m.iz-goal.iz));open.add(m.id);}
  }
 }
 return [];
}
function setRoute(x,z,callback){route=pathTo(x,z);arrival=callback;hideWelcome();if(!route.length){toast('Try a clear spot along the path.');return;}const end=route[route.length-1];destinationRing.position.set(end.x,.24+terrainHeight(end.x,end.z),end.z);destinationRing.visible=true;world.focus();}
function travel(item,kind){if(panel.open)return;setRoute(item.tx??item.x,item.tz??item.z,()=>kind==='note'?collect(item):showPlace(item));}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),-.2),hit=new THREE.Vector3();
let pointerStart;
renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>10||panel.open)return;pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);raycaster.setFromCamera(pointer,camera);const picked=raycaster.intersectObject(terrain)[0];if(picked){hit.copy(picked.point);if(walkable(hit.x,hit.z))setRoute(hit.x,hit.z,null);}else if(raycaster.ray.intersectPlane(ground,hit)&&hit.z>6&&walkable(hit.x,hit.z))setRoute(hit.x,hit.z,null);pointerStart=null;});
function interact(){if(near){near.kind==='note'?collect(near.item):showPlace(near.item);}}
$('#interact').onclick=interact;
const movementKeys=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
addEventListener('keydown',e=>{
 if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
 const key=e.key.toLowerCase();
 if(panel.open){if(/^[1-7]$/.test(key)&&content.querySelector('.piano-keys')&&!e.repeat)playNote(+key-1);return;}
 if(movementKeys.includes(key)){e.preventDefault();keys.add(key);hideWelcome();}
 if(key==='e'&&!e.repeat){e.preventDefault();interact();}
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{keys.clear();lastTime=0;});
const directionKeys={up:'arrowup',left:'arrowleft',down:'arrowdown',right:'arrowright'};
document.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(directionKeys[b.dataset.dir]);hideWelcome();});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(directionKeys[b.dataset.dir]));});
function resize(){const aspect=innerWidth/innerHeight,h=Math.max(28,29/aspect);camera.left=-h*aspect/2;camera.right=h*aspect/2;camera.top=h/2;camera.bottom=-h/2;camera.zoom=zoom;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);resize();
$('#zoom-in').onclick=()=>{zoom=Math.min(1.6,zoom+.15);resize();};$('#zoom-out').onclick=()=>{zoom=Math.max(.7,zoom-.15);resize();};
const projected=new THREE.Vector3();
function updatePins(){for(const item of [...places,...noteInfo]){projected.set(item.x,item.anchorY,item.z).project(camera);const x=(projected.x+1)*innerWidth/2,y=(1-projected.y)*innerHeight/2;item.el.style.left=x+'px';item.el.style.top=y+'px';item.el.hidden=found.has(item.id)||x<20||x>innerWidth-20||y<85||y>innerHeight-70;}}
let celebrationUntil=0;
const confetti=Array.from({length:26},(_,i)=>{const m=box(.09,.14,.04,['#f0c875','#75b0bd','#a0c8a5'][i%3],0,0,0);m.visible=false;return m;});
function updateInteraction(){
 let candidate=null,best=1.45;
 for(const n of noteInfo){const d=Math.hypot(player.position.x-n.x,player.position.z-n.z);if(!found.has(n.id)&&d<best){candidate={kind:'note',item:n};best=d;}}
 for(const p of places){const d=Math.hypot(player.position.x-p.tx,player.position.z-p.tz);if(d<best){candidate={kind:'place',item:p};best=d;}}
 near=candidate;$('#interact').hidden=!near||panel.open;if(near)$('#interact-label').textContent=near.kind==='note'?'Collect research page':near.item.label;
}
function frame(now){requestAnimationFrame(frame);const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;if(document.hidden)return;
 updateSeaLight(reduced?2.4:now*.001);
 let dx=0,dz=0,moving=false;
 if(!panel.open){
  const horizontal=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
  const vertical=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
  if(horizontal||vertical){route=[];arrival=null;destinationRing.visible=false;dx=horizontal*.818+vertical*.575;dz=-horizontal*.575+vertical*.818;const len=Math.hypot(dx,dz);dx/=len;dz/=len;}
  else if(route.length){let target=route[0],distance=Math.hypot(target.x-player.position.x,target.z-player.position.z);if(distance<.09){route.shift();if(!route.length){destinationRing.visible=false;const done=arrival;arrival=null;done?.();}target=route[0];}
   if(target){const distance=Math.hypot(target.x-player.position.x,target.z-player.position.z);const ratio=Math.min(1,distance/(3*dt||1));dx=(target.x-player.position.x)/distance*ratio;dz=(target.z-player.position.z)/distance*ratio;}}
  if(dx||dz){const nx=player.position.x+dx*dt*3,nz=player.position.z+dz*dt*3;
   if(walkable(nx,nz)){player.position.x=nx;player.position.z=nz;moving=true;}else{if(walkable(nx,player.position.z)){player.position.x=nx;moving=true;}if(walkable(player.position.x,nz)){player.position.z=nz;moving=true;}}
   player.rotation.y=Math.atan2(dx,dz);
  }
 }
 walkPhase+=dt*(moving?11:0);legs.forEach((leg,i)=>leg.rotation.x=moving?Math.sin(walkPhase+i*Math.PI)*.45:0);player.position.y=.23+terrainHeight(player.position.x,player.position.z)+(moving&&!reduced?Math.abs(Math.sin(walkPhase))*.035:0);
 ring.position.y=.235+terrainHeight(player.position.x,player.position.z);ring.position.x=player.position.x;ring.position.z=player.position.z;
 robot.position.x+=(player.position.x+.85-robot.position.x)*Math.min(dt*3,1);robot.position.z+=(player.position.z+.65-robot.position.z)*Math.min(dt*3,1);robot.position.y=.95+terrainHeight(robot.position.x,robot.position.z)+(reduced?0:Math.sin(now*.0025)*.1);robot.rotation.y=player.rotation.y*.3;
 if(!reduced){boat.position.y=-.4+Math.sin(now*.001)*.08;boat.rotation.z=Math.sin(now*.0008)*.025;noteInfo.forEach((n,i)=>{n.mesh.position.y=1.05+terrainHeight(n.x,n.z)+Math.sin(now*.002+i)*.12;n.mesh.rotation.y=Math.sin(now*.0008+i)*.28;});ripples.forEach((r,i)=>r.position.y=-.74+Math.sin(now*.001+i)*.012);}
 confetti.forEach((m,i)=>{m.visible=now<celebrationUntil&&!reduced;if(m.visible){const t=(now*.0006+i*.13)%1;m.position.set(player.position.x+Math.cos(i*2.4)*(t*3),.4+(1-t)*4,player.position.z+Math.sin(i*2.4)*(t*3));m.rotation.set(now*.002+i,i,now*.001);}});
 updateInteraction();updatePins();world.dataset.position=player.position.x.toFixed(2)+','+player.position.z.toFixed(2);renderer.render(scene,camera);$('#loading').hidden=true;
}
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#loading').hidden=false;$('#loading').className='failed';$('#loading').innerHTML='The island needs a fresh start. <a href="./">Reload the island →</a>';});
requestAnimationFrame(frame);
