// Original looping score: a slow C-major piano miniature with synthesized surf.
// Audio is created only after a gesture; no remote audio or autoplay dependency.
export function createIslandMusic({button,slider,getContext,onError}) {
 let context,master,room,waves,timer,nextTime=0,step=0,ducked=false,unlocked=false,enabled=true,volume=.35;
 try{enabled=localStorage.getItem('bo-island-music')!=='off';const saved=localStorage.getItem('bo-island-volume');if(saved!==null&&Number.isFinite(+saved))volume=Math.max(0,Math.min(1,+saved));}catch(_){}
 slider.value=Math.round(volume*100);
 const chords=[[48,55,59,64],[45,52,55,60],[41,48,52,57],[43,50,55,60],[50,53,57,60],[40,47,55,59],[41,48,52,57],[43,50,55,59]];
 const melody=[[72,null,76,79],[76,null,72,71],[69,null,72,76],[74,72,null,71],[69,null,74,77],[76,74,71,null],[72,76,74,72],[71,null,67,null],[76,null,79,81],[79,76,null,72],[77,null,76,72],[74,null,71,67],[69,72,74,null],[71,null,76,74],[72,null,69,67],[72,null,null,null]];
 function save(){try{localStorage.setItem('bo-island-music',enabled?'on':'off');localStorage.setItem('bo-island-volume',String(volume));}catch(_){} }
 function updateUI(){const playing=unlocked&&enabled&&context?.state==='running'&&!document.hidden;button.setAttribute('aria-pressed',String(!!playing));button.setAttribute('aria-label',playing?'Turn off background music':'Turn on background music');button.querySelector('span').textContent=playing?'Music on':'Music off';button.dataset.state=playing?'playing':'paused';button.title=playing?'Seaside piano · original instrumental loop':'Play seaside piano and gentle waves';}
 function setGain(){if(!master)return;const target=enabled&&!document.hidden?volume*(ducked?.2:1):0;master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(target,context.currentTime,.18);}
 function note(midi,time,velocity=.09,duration=2.8){
  const voice=context.createGain();voice.gain.setValueAtTime(0,time);voice.gain.linearRampToValueAtTime(velocity,time+.014);voice.gain.exponentialRampToValueAtTime(.0001,time+duration);
  const pan=context.createStereoPanner();pan.pan.value=(midi-60)/75;voice.connect(pan);pan.connect(master);pan.connect(room);
  let ended=0;for(const [partial,amount] of [[1,1],[2,.19],[3,.055]]){const osc=context.createOscillator(),level=context.createGain();osc.type='sine';osc.frequency.value=440*Math.pow(2,(midi-69)/12)*partial;level.gain.value=amount;osc.connect(level);level.connect(voice);osc.start(time);osc.stop(time+duration+.03);osc.onended=()=>{osc.disconnect();level.disconnect();if(++ended===3){voice.disconnect();pan.disconnect();}};}
 }
 function schedule(){if(!enabled||document.hidden||context.state!=='running')return;
  if(nextTime<context.currentTime)nextTime=context.currentTime+.08;
  while(nextTime<context.currentTime+.3){
   const bar=Math.floor(step/8),beat=step%8,chord=chords[bar%chords.length];
   const arp=[0,2,1,3,2,1,3,2][beat];note(chord[arp],nextTime,beat===0?.1:.064,2.7);
   if(beat===0)note(chord[0]-12,nextTime,.09,3.4);
   if(beat%2===0){const pitch=melody[bar%melody.length][beat/2];if(pitch!==null)note(pitch,nextTime+.025,.115,3.1);}
   step=(step+1)%128;nextTime+=60/72/2;
  }
 }
 function build(){
  context=getContext();master=context.createGain();master.gain.value=0;
  const limiter=context.createDynamicsCompressor();limiter.threshold.value=-16;limiter.ratio.value=3;master.connect(limiter);limiter.connect(context.destination);
  room=context.createConvolver();const impulse=context.createBuffer(2,context.sampleRate*2.4,context.sampleRate);
  for(let c=0;c<2;c++){const data=impulse.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3)*.18;}room.buffer=impulse;
  const wet=context.createGain();wet.gain.value=.23;room.connect(wet);wet.connect(master);
  // Low, slow waves share the music volume and mute controls.
  const noise=context.createBuffer(1,context.sampleRate*8,context.sampleRate),data=noise.getChannelData(0);let brown=0;
  for(let i=0;i<data.length;i++){brown=(brown+.018*(Math.random()*2-1))/1.018;data[i]=brown*3.4;}
  waves=context.createBufferSource();waves.buffer=noise;waves.loop=true;
  const lowpass=context.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=650;
  const waveGain=context.createGain();waveGain.gain.value=.07;
  const swell=context.createOscillator(),depth=context.createGain();swell.frequency.value=.085;depth.gain.value=.04;swell.connect(depth);depth.connect(waveGain.gain);waves.connect(lowpass);lowpass.connect(waveGain);waveGain.connect(master);waves.start();swell.start();
  context.addEventListener('statechange',updateUI);
 }
 async function start(){
  if(!enabled)return;
  try{if(!context)build();await context.resume();unlocked=true;setGain();nextTime=context.currentTime+.1;if(!timer)timer=setInterval(schedule,120);schedule();updateUI();}
  catch(_){enabled=false;setGain();updateUI();onError?.();}
 }
 button.addEventListener('click',()=>{if(!unlocked||!enabled||context?.state!=='running'){enabled=true;save();void start();}else{enabled=false;save();setGain();clearInterval(timer);timer=null;updateUI();}});
 slider.addEventListener('input',()=>{volume=+slider.value/100;save();setGain();});
 // A single user gesture can start the ambience, but a remembered mute wins.
 function firstGesture(event){if(event.target.closest?.('#music-controls'))return;if(event.type==='keydown'&&(event.metaKey||event.ctrlKey||!['Enter',' ','w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)))return;document.removeEventListener('pointerdown',firstGesture);document.removeEventListener('keydown',firstGesture);void start();}
 document.addEventListener('pointerdown',firstGesture);document.addEventListener('keydown',firstGesture);
 document.addEventListener('visibilitychange',()=>{if(!context)return;setGain();if(document.hidden){clearInterval(timer);timer=null;}else if(unlocked&&enabled){nextTime=context.currentTime+.1;timer??=setInterval(schedule,120);schedule();}updateUI();});
 addEventListener('pagehide',()=>{clearInterval(timer);timer=null;if(master)master.gain.value=0;});
 addEventListener('pageshow',event=>{if(event.persisted&&unlocked&&enabled){setGain();nextTime=context.currentTime+.1;timer??=setInterval(schedule,120);updateUI();}});
 updateUI();
 return {setDucked(value){ducked=value;button.dataset.ducked=String(value);setGain();}};
}
