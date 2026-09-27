import * as THREE from './vendor/three.module.js';

// Layer irregular brush marks rather than smooth gradients. The same pigment
// texture is shared across small objects to keep the scene light on mobile.
export function paintTexture(base, palette, count=1800, direction=0) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
  let seed=37;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  for(let i=0;i<count;i++){
    const x=rand()*512,y=rand()*512,w=8+rand()*36,h=2+rand()*8;
    ctx.save();ctx.translate(x,y);ctx.rotate(direction+(rand()-.5)*.6);
    ctx.fillStyle=palette[Math.floor(rand()*palette.length)];ctx.globalAlpha=.3+rand()*.5;
    ctx.beginPath();ctx.moveTo(-w/2,-h*.2);ctx.lineTo(-w*.33,-h*.55);ctx.lineTo(w*.43,-h*.35);ctx.lineTo(w/2,h*.12);ctx.lineTo(w*.24,h*.48);ctx.lineTo(-w*.44,h*.35);ctx.closePath();ctx.fill();
    ctx.globalAlpha=.12;ctx.strokeStyle='#fff8dc';ctx.lineWidth=.6;
    for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-w*.36,-h*.2+j*h*.2);ctx.lineTo(w*.4,-h*.27+j*h*.2);ctx.stroke();}
    ctx.restore();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
export const pigment=paintTexture('#f0e9d5',['#fffbed','#dfdacb','#fbf5df','#c9cfc5'],1200);
export const meadow=paintTexture('#b0b779',['#d6c589','#769b73','#9dab71','#e3d2a3','#87a78c','#c1bf85'],2700,-.35);
meadow.repeat.set(3,3);
export const sand=paintTexture('#e7d3a5',['#f4e6bd','#cfb889','#fff0d0','#a8b8b2','#e1c394'],1900);
sand.repeat.set(2,2);
export const waterFallback=paintTexture('#267ca7',['#28639c','#348db9','#56aeb9','#9acfc6','#3c9dc0','#d1ddd1'],2300);
waterFallback.repeat.set(19,19);
