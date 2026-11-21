import {generateNewtMusicXML} from './newt-blueprint.js';
import {mountXmlViewer} from './xml-viewer.js';
import {normalizeLayers} from './newt-layers.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let focus=0,zoom=2;
const px=()=>[18,32,52,80,120][zoom];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function mountTimeline(root,draft,store,exportXml,exportJson,previewXml){
 const sec=draft.sections;focus=clamp(focus,0,sec.length-1);
 const beats=Number(draft.beats)||4;
 sec.forEach(s=>normalizeLayers(s,draft.parts,beats));
 function draw(options={}){
  const previousEditor=root.querySelector('.nt-editor');
  const previousOverview=root.querySelector('.nt-rail');
  const previousX=previousEditor?.scrollLeft||0,previousOverviewX=previousOverview?.scrollLeft||0;
  const previousUnit=previousEditor?Number(previousEditor.dataset.unit)||px():px();
  const previousSection=previousEditor?.dataset.section;
  const total=sec.reduce((a,s)=>a+s.bars,0),overviewScale=clamp(780/Math.max(total,1),13,65);
  const active=sec[focus],unit=px(),barWidth=unit*beats;
  let start=0;
  const overview=sec.map((s,i)=>{const left=start*overviewScale;start+=s.bars;return '<button class="nt-region '+(i===focus?'selected':'')+'" data-section="'+i+'" style="left:'+left+'px;width:'+Math.max(32,s.bars*overviewScale-3)+'px"><b>'+esc(s.type)+'</b><small>'+s.bars+' bars</small></button>'}).join('');
  const rulers=Array.from({length:active.bars},(_,b)=>'<div class="nt-measure" style="width:'+barWidth+'px">'+Array.from({length:beats},(_,j)=>'<span style="width:'+unit+'px">'+(b+1)+'.'+(j+1)+'</span>').join('')+'</div>').join('');
  const chords=active.chordBars.map((bar,b)=>Array.from({length:beats},(_,j)=>{const beat=j+1,first=bar.find(x=>x.beat===beat),half=bar.find(x=>x.beat===beat+.5),split=!!half;const cell=(c,pos)=>'<button type="button" class="nt-chordtap" data-chord-tap="'+b+':'+pos+'" aria-label="Edit chord, bar '+(b+1)+' beat '+pos+'">'+esc(c?.symbol||'＋')+'</button>';return '<div class="nt-beat" style="width:'+unit+'px"><div class="nt-chordcells">'+cell(first,beat)+(split?cell(half,beat+.5):'')+'</div>'+(zoom>=2?'<button class="nt-split" data-split="'+b+':'+beat+'">'+(split?'−':'½+')+'</button>':'')+'</div>'}).join('')).join('');
  const rhythm=active.vocalRhythm.trim().split(/\s+/).filter(Boolean);
  const lyric=active.lyrics.trim().split(/\s+/).filter(Boolean);
  const parts=draft.parts.map(p=>'<div class="nt-part"><span>'+esc(p)+'</span><select data-part="'+esc(p)+'">'+['playing','tacet','cue'].map(v=>'<option value="'+v+'" '+(active.band[p]===v?'selected':'')+'>'+v+'</option>').join('')+'</select></div>').join('');
  root.innerHTML='<style>.nt button,.nt input,.nt select,.nt textarea{font:inherit}.nt-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}.nt-toolbar button{padding:8px 12px}.nt-rail{overflow-x:auto;border:1px solid #466457;border-radius:12px;background:#10231f;padding:12px 8px}.nt-overview{position:relative;height:86px}.nt-region{position:absolute;top:10px;height:62px;overflow:hidden;text-align:left;display:flex;flex-direction:column;justify-content:center;gap:5px;padding:9px;border-radius:8px;background:#31574d;color:#f2e6c8;border:1px solid #739b80}.nt-region.selected{background:#776238;border-color:#e9c77a}.nt-region small{font-size:11px}.nt-section-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.nt-editor{overflow-x:auto;touch-action:pan-x pan-y;border:1px solid #466457;border-radius:12px;background:#0e231e}.nt-inner{width:max-content;min-width:100%}.nt-ruler,.nt-chords{display:flex}.nt-measure{display:flex;flex-shrink:0;border-right:2px solid #b59b66;background:#203b33}.nt-measure span{box-sizing:border-box;border-right:1px solid #456256;font-size:10px;color:#b5c7b9;padding:7px 3px}.nt-beat{box-sizing:border-box;flex-shrink:0;border-right:1px solid #416355;min-height:79px;padding:3px;background:#17362e}.nt-beat:nth-child(4n){border-right:2px solid #b59b66}.nt-chordcells{display:flex;gap:2px}.nt-chordcells input{box-sizing:border-box;min-width:0;width:100%;padding:8px 1px;background:#244b3e;color:#fff;border:1px solid #527764;border-radius:5px;text-align:center;font-size:12px}.nt-split{font-size:10px!important;padding:4px 5px!important;margin-top:4px;min-width:0}.nt-lane{display:flex;align-items:center;min-height:44px;border-top:1px solid #466457;padding:6px 10px;gap:8px;white-space:nowrap}.nt-lane-title{font-size:11px;color:#d7bc82;min-width:80px}.nt-chip{background:#2c5146;border:1px solid #5b816c;border-radius:5px;padding:5px 8px;font-size:12px}.nt-detail{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:16px 0}.nt-detail label{display:flex;flex-direction:column;gap:5px}.nt-detail textarea,.nt-detail input,.nt-detail select{box-sizing:border-box;width:100%;padding:9px;background:#112c25;color:white;border:1px solid #547366;border-radius:7px}.nt-part{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px;border-bottom:1px solid #345044}.nt-part select{width:110px}.nt-actions{display:flex;flex-wrap:wrap;gap:8px;margin:15px 0}.nt-note{font-size:12px;opacity:.7}</style><div class="nt"><div class="nt-section-head"><div><h3>Newt · Song Timeline</h3><p class="note">Select a section, then zoom into its bars, beats and chord changes.</p></div><span class="pill">'+total+' bars · '+draft.bpm+' BPM</span></div><div class="nt-detail"><label>Title<input id="nt-title" value="'+esc(draft.title)+'"></label><label>Tempo<input id="nt-bpm" type="number" min="20" max="400" value="'+draft.bpm+'"></label><label>Beats per bar<input id="nt-beats" type="number" min="1" max="16" value="'+beats+'"></label></div><h4>Song structure</h4><div class="nt-rail"><div class="nt-overview" style="width:'+Math.max(550,total*overviewScale)+'px">'+overview+'</div></div><div class="nt-toolbar"><button id="nt-add">+ Section</button><button id="nt-left">← Move</button><button id="nt-right">Move →</button><button id="nt-remove">Remove</button></div><div class="nt-section-head"><h4>'+esc(active.type)+' · section editor</h4><div class="nt-toolbar"><button id="nt-zoomout">− Zoom</button><span>'+['Overview','Bars','Beats','Eighths','Fine'][zoom]+'</span><button id="nt-zoomin">+ Zoom</button></div></div><div class="nt-detail"><label>Section name<select id="nt-type">'+['Intro','Verse','Pre-Chorus','Chorus','Bridge','Solo','Instrumental','Breakdown','Tag','Outro','Custom'].map(x=>'<option '+(active.type===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label><label>Length in bars<input id="nt-bars" type="number" min="1" max="128" value="'+active.bars+'"></label></div><div class="nt-editor" data-unit="'+unit+'" data-section="'+focus+'"><div class="nt-inner" style="width:'+active.bars*barWidth+'px"><div class="nt-ruler">'+rulers+'</div><div class="nt-chords">'+chords+'</div><div class="nt-lane"><span class="nt-lane-title">Vocal rhythm</span>'+rhythm.map(x=>'<span class="nt-chip">'+esc(x)+'</span>').join('')+'</div><div class="nt-lane"><span class="nt-lane-title">Lyrics</span>'+lyric.map(x=>'<span class="nt-chip">'+esc(x)+'</span>').join('')+'</div><div class="nt-lane"><span class="nt-lane-title">Band</span>'+draft.parts.filter(p=>active.band[p]==='playing').map(p=>'<span class="nt-chip">'+esc(p)+'</span>').join('')+'</div></div></div><div class="nt-detail"><label>Lyrics<textarea id="nt-lyrics" rows="3" placeholder="Paste lyrics">'+esc(active.lyrics)+'</textarea></label><label>Pitchless vocal rhythm<textarea id="nt-rhythm" rows="3" placeholder="Walk/8 ing/8 down/4 R/8">'+esc(active.vocalRhythm)+'</textarea></label></div><details><summary>Instrument assignments · '+esc(active.type)+'</summary><div>'+parts+'</div></details><label style="display:block;margin-top:12px">Creative direction<textarea id="nt-notes" style="width:100%;box-sizing:border-box;background:#102522;color:white" rows="2">'+esc(active.notes)+'</textarea></label><div class="nt-actions"><button id="nt-xml">↓ Export MusicXML</button><button id="nt-json">↓ Save blueprint JSON</button></div><p class="nt-note">Local-first editor. The timeline, lyrics and rhythm are saved, but pitchless rhythm and beat-accurate chord changes are not yet fully engraved in MusicXML.</p></div>';
  mountXmlViewer(root,generateNewtMusicXML);
  const editor=root.querySelector('.nt-editor'),rail=root.querySelector('.nt-rail');
  if(editor){const max=Math.max(0,editor.scrollWidth-editor.clientWidth);const target=options.resetScroll||String(focus)!==previousSection?0:options.zoomAnchor?((previousX+options.zoomAnchor)*unit/previousUnit-options.zoomAnchor):previousX;editor.scrollLeft=clamp(target,0,max)}
  if(rail)rail.scrollLeft=previousOverviewX;
  root.querySelectorAll('[data-section]').forEach(el=>el.onclick=()=>{focus=+el.dataset.section;draw({resetScroll:true})});
  const on=(id,fn)=>root.querySelector('#'+id).onclick=fn;
  on('nt-zoomin',()=>{zoom=clamp(zoom+1,0,4);draw({zoomAnchor:root.querySelector('.nt-editor')?.clientWidth/2||0})});on('nt-zoomout',()=>{zoom=clamp(zoom-1,0,4);draw({zoomAnchor:root.querySelector('.nt-editor')?.clientWidth/2||0})});
  on('nt-add',()=>{sec.push({id:crypto.randomUUID(),type:'Custom',bars:4,chords:'',notes:'',lyrics:'',vocalRhythm:'',band:{}});focus=sec.length-1;store();draw({resetScroll:true})});
  on('nt-left',()=>{if(focus>0){[sec[focus-1],sec[focus]]=[sec[focus],sec[focus-1]];focus--;store();draw({resetScroll:true})}});
  on('nt-right',()=>{if(focus<sec.length-1){[sec[focus+1],sec[focus]]=[sec[focus],sec[focus+1]];focus++;store();draw({resetScroll:true})}});
  on('nt-remove',()=>{if(sec.length>1&&confirm('Remove this section?')){sec.splice(focus,1);focus=clamp(focus,0,sec.length-1);store();draw({resetScroll:true})}});
  const field=(id,fn)=>root.querySelector('#'+id).onchange=ev=>{fn(ev.target.value);store();draw()};
  field('nt-title',v=>draft.title=v);field('nt-bpm',v=>draft.bpm=clamp(+v||120,20,400));field('nt-beats',v=>{draft.beats=clamp(+v||4,1,16)});
  field('nt-type',v=>active.type=v);field('nt-bars',v=>{active.bars=clamp(+v||4,1,128);normalizeLayers(active,draft.parts,Number(draft.beats)||4)});
  for(const [id,key] of [['nt-lyrics','lyrics'],['nt-rhythm','vocalRhythm'],['nt-notes','notes']])root.querySelector('#'+id).oninput=ev=>{active[key]=ev.target.value;store()};
  root.querySelectorAll('[data-part]').forEach(el=>el.onchange=()=>{active.band[el.dataset.part]=el.value;store();draw()});
  root.querySelectorAll('[data-chord-tap]').forEach(el=>el.onclick=()=>{
   const [b,beat]=el.dataset.chordTap.split(':').map(Number);
   const bar=active.chordBars[b];let chord=bar.find(x=>x.beat===beat);
   if(!chord){chord={beat,duration:beat%1?.5:1,symbol:''};bar.push(chord);bar.sort((a,z)=>a.beat-z.beat)}
   const existing=root.querySelector('.nt-chord-modal');if(existing)existing.remove();
   const overlay=document.createElement('div');overlay.className='nt-chord-modal';
   overlay.innerHTML='<div class="nt-chord-dialog" role="dialog" aria-modal="true" aria-label="Edit chord"><h3>Bar '+(b+1)+' · Beat '+beat+'</h3><label>Chord symbol<input class="nt-chord-entry" type="text" autocomplete="off" autocapitalize="characters" placeholder="e.g. Em7, F#7, Bbmaj7"></label><div class="nt-chord-presets"></div><div class="nt-chord-buttons"><button type="button" data-chord-clear>Clear</button><button type="button" data-chord-cancel>Cancel</button><button type="button" class="primary" data-chord-save>Save chord</button></div></div>';
   root.appendChild(overlay);
   const input=overlay.querySelector('.nt-chord-entry');input.value=chord.symbol||'';
   const close=()=>overlay.remove();
   overlay.addEventListener('click',ev=>{if(ev.target===overlay)close()});
   overlay.querySelector('[data-chord-cancel]').onclick=close;
   overlay.querySelector('[data-chord-clear]').onclick=()=>{input.value='';input.focus()};
   const saveChord=()=>{chord.symbol=input.value.trim();store();close();draw()};
   overlay.querySelector('[data-chord-save]').onclick=saveChord;
   input.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();saveChord()}if(ev.key==='Escape')close()});
   input.focus();
  });
  root.querySelectorAll('[data-chord]').forEach(el=>el.oninput=()=>{const [b,beat]=el.dataset.chord.split(':').map(Number);const bar=active.chordBars[b];let chord=bar.find(x=>x.beat===beat);if(!chord){chord={beat,duration:beat%1?.5:1,symbol:''};bar.push(chord);bar.sort((a,z)=>a.beat-z.beat)}chord.symbol=el.value;store()});
  root.querySelectorAll('[data-split]').forEach(el=>el.onclick=()=>{const [b,beat]=el.dataset.split.split(':').map(Number),bar=active.chordBars[b],half=bar.find(x=>x.beat===beat+.5);if(half){bar.splice(bar.indexOf(half),1)}else{bar.push({beat:beat+.5,duration:.5,symbol:''});bar.sort((a,z)=>a.beat-z.beat)}store();draw()});
  on('nt-xml',exportXml);on('nt-json',exportJson);
 }
 draw();
}
