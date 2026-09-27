// Wide-screen margins: a quiet painted coast, pointer ripples, and a reading voyage.
(() => {
 const wide=matchMedia('(min-width: 1440px) and (pointer: fine)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const left=document.createElement('div'),right=document.createElement('div');
 left.className='coastal-margin coastal-margin-left';right.className='coastal-margin coastal-margin-right';
 left.setAttribute('aria-hidden','true');right.setAttribute('aria-hidden','true');
 const canvas=document.createElement('canvas');canvas.className='coastal-shimmer';canvas.setAttribute('aria-hidden','true');
 const rail=document.createElement('nav');rail.className='reading-voyage';rail.setAttribute('aria-label','Sail through page sections');
 const stops=[['about','About'],['news','News'],['research','Publications'],['academic','Academic'],['interests','Beyond research']];
 rail.innerHTML=`<span class="voyage-caption">SAIL THROUGH</span><div class="voyage-course"><svg class="voyage-thread" viewBox="0 0 24 272" preserveAspectRatio="none" aria-hidden="true"><path d="M12 12C-3 64 27 90 12 136S1 205 12 260"/></svg><div class="voyage-boat" aria-hidden="true"><svg viewBox="0 0 44 42"><path d="M21 4v27" stroke="#6b8c8c" stroke-width="1.5" stroke-linecap="round"/><path d="M19 7 7 25h12Z" fill="#fff6d3" stroke="#c9bb87" stroke-width=".8"/><path d="m24 11 11 15H24Z" fill="#a0c6c5"/><path d="m6 30 32-1-7 7H13Z" fill="#b99059"/><path d="M5 38c5-3 9 3 15 0s10 3 18-1" fill="none" stroke="#5499ac" stroke-width="1.4" stroke-linecap="round"/></svg></div><ol>${stops.map(([id,label])=>`<li><a href="#${id}"><span class="voyage-dot"></span><span>${label}</span></a></li>`).join('')}</ol></div>`;
 document.body.append(left,right,canvas,rail);
 const ctx=canvas.getContext('2d'),boat=rail.querySelector('.voyage-boat'),links=[...rail.querySelectorAll('a')];
 let width=0,height=0,edge=0,points=[],frame=0,queued=false,lastSpawn=0,scrollTimer;
 function voyage(){
  queued=false;if(!wide.matches)return;
  const maximum=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  const positions=stops.map(([id],i)=>i===0?0:Math.min(maximum,document.getElementById(id).getBoundingClientRect().top+scrollY-110));
  let segment=0;while(segment<positions.length-1&&scrollY>=positions[segment+1]-1)segment++;
  const fraction=segment===positions.length-1?0:Math.max(0,Math.min(1,(scrollY-positions[segment])/Math.max(1,positions[segment+1]-positions[segment])));
  boat.style.setProperty('--boat-y',`${12+(segment+fraction)*62}px`);
  links.forEach((link,i)=>{if(i===segment)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 }
 function resize(){
  if(!wide.matches){cancelAnimationFrame(frame);frame=0;points=[];canvas.width=canvas.height=1;return;}
  width=innerWidth;height=innerHeight;edge=Math.max(0,(width-document.querySelector('main.wrap').getBoundingClientRect().width)/2-28);
  const dpr=Math.min(devicePixelRatio,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);voyage();
 }
 function paint(now){
  frame=0;if(!ctx)return;ctx.clearRect(0,0,width,height);ctx.save();ctx.beginPath();ctx.rect(0,82,edge,height-82);ctx.rect(width-edge,82,edge,height-82);ctx.clip();points=points.filter(p=>now-p.born<1900);
  for(const p of points){const age=(now-p.born)/1900,alpha=Math.sin(Math.PI*age)*.65;
   ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=p.color;ctx.lineWidth=p.thickness;ctx.lineCap='round';
   const x=p.x+age*p.drift,y=p.y-age*7,length=p.length*(.55+age*.8);
   ctx.beginPath();ctx.moveTo(x-length/2,y);ctx.quadraticCurveTo(x,y-3-age*3,x+length/2,y-1);ctx.stroke();
   if(p.spark){ctx.globalAlpha=alpha*.9;ctx.fillStyle='#eac677';ctx.beginPath();ctx.ellipse(x+length*.3,y-5,2.3,1.1,0,0,Math.PI*2);ctx.fill();}
   ctx.restore();
  }
  ctx.restore();if(points.length)frame=requestAnimationFrame(paint);
 }
 function pointer(event){
  if(!wide.matches||reduced.matches||!ctx||document.hidden||event.clientY<108)return;
  if(event.clientX>edge&&event.clientX<width-edge)return;
  const now=performance.now();if(now-lastSpawn<45)return;lastSpawn=now;
  for(let i=0;i<3;i++)points.push({x:event.clientX+(Math.random()-.5)*48,y:event.clientY+(Math.random()-.5)*35,born:now-i*70,length:8+Math.random()*17,drift:(Math.random()-.5)*10,thickness:.8+Math.random()*1.3,color:['#85b8ab','#70a9bb','#dbbd78'][i],spark:i===2});
  if(points.length>84)points.splice(0,points.length-84);if(!frame)frame=requestAnimationFrame(paint);
 }
 addEventListener('pointermove',pointer,{passive:true});
 addEventListener('scroll',()=>{if(!wide.matches)return;if(!queued){queued=true;requestAnimationFrame(voyage);}rail.classList.add('is-sailing');clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>rail.classList.remove('is-sailing'),500);},{passive:true});
 addEventListener('resize',resize);addEventListener('load',voyage);wide.addEventListener('change',resize);
 reduced.addEventListener('change',()=>{points=[];ctx?.clearRect(0,0,width,height);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){points=[];cancelAnimationFrame(frame);frame=0;ctx?.clearRect(0,0,width,height);}});
 document.fonts?.ready.then(voyage);resize();
})();
