// Newt's first touch-first landscape note editor. Notes are saved with the Newt draft.
const pitchName=n=>['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][((n%12)+12)%12]+(Math.floor(n/12)-1);
const svgNote=(n,selected)=>'<ellipse cx="'+(42+n.beat*70)+'" cy="'+(89-(n.pitch-60)*5)+'" rx="8" ry="5" fill="'+(selected?'#c48c39':'#25201c')+'" transform="rotate(-17 '+(42+n.beat*70)+' '+(89-(n.pitch-60)*5)+')"/><path d="M'+(50+n.beat*70)+' '+(89-(n.pitch-60)*5)+'v-31" stroke="#25201c" stroke-width="2"/>';
export function mountNewtController(host,draft,save){
 const section=draft.sections?.[0];if(!section)return;
 draft.controllerNotes ||= {};
 let part=draft.parts?.[0]||'Trumpet',cursor=0,selected=0,view='hybrid',duration=1,playing=false,audio=null;
 const notes=()=>draft.controllerNotes[part]||[];
 const persist=()=>{draft.controllerNotes[part]=notes();save()};
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const root=document.createElement('section');root.className='newt-game';host.prepend(root);
 const audition=(pitch,dur=.3)=>{try{audio||=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;osc.type='triangle';osc.frequency.value=440*Math.pow(2,(pitch-69)/12);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.12,t+.02);gain.gain.exponentialRampToValueAtTime(.0001,t+dur);osc.connect(gain).connect(audio.destination);osc.start(t);osc.stop(t+dur+.02)}catch{}};
 function draw(){
  const list=notes();selected=Math.min(selected,Math.max(0,list.length-1));const note=list[selected];
  const max=16;
  const notation='<svg viewBox="0 0 1160 160" aria-label="Four-bar notation preview">'+[58,68,78,88,98].map(y=>'<path d="M20 '+y+'H1140" stroke="#50483c" stroke-width="1"/>').join('')+[0,1,2,3,4].map(i=>'<path d="M'+(20+i*280)+' 58v40" stroke="#50483c"/>').join('')+list.map((n,i)=>svgNote(n,i===selected)).join('')+'<path d="M'+(42+cursor*70)+' 24v112" stroke="#c48c39" stroke-width="2"/></svg>';
  const roll='<div class="ng-roll" role="group" aria-label="Piano roll">'+Array.from({length:17},(_,i)=>{const pitch=72-i;return '<div class="ng-pitch-row"><span>'+pitchName(pitch)+'</span><div class="ng-pitch-track" data-pitch="'+pitch+'">'+list.filter(n=>n.pitch===pitch).map(n=>'<button class="ng-note '+(list.indexOf(n)===selected?'active':'')+'" data-note="'+list.indexOf(n)+'" style="left:'+(n.beat/max*100)+'%;width:'+(n.duration/max*100)+'%" aria-label="'+pitchName(n.pitch)+' at beat '+(n.beat+1)+'"></button>').join('')+'</div></div>'}).join('')+'</div>';
  root.innerHTML='<div class="ng-top"><strong>♬ NEWT <small>CONTROLLER</small></strong><select data-part aria-label="Instrument">'+(draft.parts||[]).map(p=>'<option '+(p===part?'selected':'')+'>'+esc(p)+'</option>').join('')+'</select><span>4 bars · '+(draft.bpm||120)+' BPM</span><button data-close>Close</button></div><div class="ng-body"><div class="ng-left"><div class="ng-pad"><button data-move="-4">▲</button><div><button data-move="-1">◀</button><button data-move="1">▶</button></div><button data-move="4">▼</button></div><button data-action="previous">L1 · Part</button><button data-action="next">R1 · Part</button></div><div class="ng-work"><div class="ng-tabs"><button data-view="hybrid" '+(view==='hybrid'?'class="active"':'')+'>Hybrid</button><button data-view="score" '+(view==='score'?'class="active"':'')+'>Score</button><button data-view="roll" '+(view==='roll'?'class="active"':'')+'>Piano roll</button></div>'+(view!=='roll'?'<div class="ng-score">'+notation+'</div>':'')+(view!=='score'?roll:'')+'<div class="ng-status">Beat '+(cursor+1)+' · '+(note?pitchName(note.pitch)+' · '+note.duration+' beat(s)':'No note selected')+'</div></div><div class="ng-right"><div class="ng-abxy"><button data-action="duration">X <small>Length</small></button><button data-action="up">Y <small>Pitch +</small></button><button data-action="insert">A <small>Insert</small></button><button data-action="delete">B <small>Delete</small></button></div><button data-action="down">Pitch −</button><button data-action="audition">♪ Audition</button><button data-action="play">▶ Play phrase</button></div></div>';
  root.querySelector('[data-part]').onchange=e=>{part=e.target.value;cursor=0;selected=0;draw()};
  root.querySelector('[data-close]').onclick=()=>root.remove();
  root.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;draw()});
  root.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{cursor=Math.max(0,Math.min(15,cursor+Number(b.dataset.move)));const idx=notes().findIndex(n=>n.beat===cursor);if(idx>=0)selected=idx;draw()});
  root.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.note);cursor=notes()[selected].beat;audition(notes()[selected].pitch);draw()});
  root.querySelectorAll('[data-pitch]').forEach(el=>el.onclick=e=>{if(e.target!==el)return;const rect=el.getBoundingClientRect();cursor=Math.min(15,Math.max(0,Math.floor((e.clientX-rect.left)/rect.width*16)));const n={beat:cursor,pitch:Number(el.dataset.pitch),duration};notes().push(n);selected=notes().length-1;persist();audition(n.pitch);draw()});
  root.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{
   const action=b.dataset.action,l=notes(),n=l[selected];
   if(action==='previous'||action==='next'){const i=draft.parts.indexOf(part);part=draft.parts[(i+(action==='next'?1:-1)+draft.parts.length)%draft.parts.length];selected=0}
   if(action==='insert'){l.push({beat:cursor,pitch:n?.pitch||67,duration});selected=l.length-1;persist();audition(l[selected].pitch)}
   if(action==='delete'&&n){l.splice(selected,1);persist()}
   if(action==='up'&&n){n.pitch=Math.min(84,n.pitch+1);persist();audition(n.pitch)}
   if(action==='down'&&n){n.pitch=Math.max(48,n.pitch-1);persist();audition(n.pitch)}
   if(action==='duration'){duration=duration===.25?.5:duration===.5?1:duration===1?2:duration===2?4:.25;if(n){n.duration=duration;persist()}}
   if(action==='audition'&&n)audition(n.pitch,.45);
   if(action==='play'&&!playing){playing=true;const snapshot=[...l].sort((a,b)=>a.beat-b.beat);snapshot.forEach(n=>setTimeout(()=>audition(n.pitch,Math.min(.7,n.duration*60/(draft.bpm||120))),n.beat*60000/(draft.bpm||120)));setTimeout(()=>{playing=false},16*60000/(draft.bpm||120))}
   draw();
  });
 }
 draw();
}
