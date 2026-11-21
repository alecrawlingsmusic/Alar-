// Newt's chart creation menu and editable instrument roster.
const CATALOG={
'Keyboard':['Piano','Electric Piano','Organ','Synthesizer','Harpsichord','Accordion','Celesta'],
'Voice':['Voice','Soprano','Alto','Tenor','Baritone','Bass Voice','Choir'],
'Rhythm':['Guitar','Acoustic Guitar','Electric Guitar','Bass','Electric Bass','Upright Bass','Drums','Percussion','Aux Percussion'],
'Brass':['Trumpet','Flugelhorn','Trombone','Bass Trombone','French Horn','Tuba'],
'Reeds & Woodwinds':['Reed','Alto Saxophone','Tenor Saxophone','Baritone Saxophone','Soprano Saxophone','Clarinet','Bass Clarinet','Flute','Piccolo','Oboe','Bassoon'],
'Strings':['Violin','Viola','Cello','Double Bass','String Section','Harp'],
'Other':['Click','Conductor Cues','Mallet Percussion','Timpani']
};
const PC=['Piano Conductor AUX','Piano RH','Piano LH'];
const PRESETS=[
{id:'piano-vocal',title:'Piano Vocal',description:'Piano and voice',parts:['Piano','Voice']},
{id:'pcscore',title:'Piano Vocal · PC Score',description:'Three-stave Piano Conductor with AUX above piano RH/LH, plus vocal',parts:[...PC,'Voice']},
{id:'ship',title:'Ship Band Standard',description:'Piano Conductor, rhythm section and three horns',parts:[...PC,'Keys','Guitar','Bass','Drums','Trumpet','Trombone','Reed','Click']},
{id:'lead',title:'Leadsheet',description:'Single melody staff and chord symbols',parts:['Lead Sheet']},
{id:'other',title:'Other',description:'Start with a blank instrument list',parts:[]}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&#39;'}[c]));
let open=false,custom=false,selection=[],selectedPreset='';
const cleanParts=parts=>[...new Set(parts.filter(x=>typeof x==='string'&&x.trim()))];
export function renderNewtMenu(root,handlers){
 const groups=Object.entries(CATALOG).map(([group,items])=>'<details><summary>'+esc(group)+'</summary><div class="newt-instruments">'+items.map(item=>'<label><input type="checkbox" data-instrument="'+esc(item)+'" '+(selection.includes(item)?'checked':'')+'>'+esc(item)+'</label>').join('')+'</div></details>').join('');
 root.innerHTML='<div class="newt-start"><button class="primary" id="newt-create" aria-expanded="'+open+'">＋ Create New Chart</button>'+(open?'<div class="inspector"><h3>Choose a chart format</h3><div class="newt-preset-grid">'+PRESETS.map(p=>'<button class="newt-preset '+(selectedPreset===p.id?'active':'')+'" data-preset="'+p.id+'"><strong>'+esc(p.title)+'</strong><small>'+esc(p.description)+'</small></button>').join('')+'<button class="newt-preset '+(custom?'active':'')+'" id="newt-custom"><strong>Custom Ensemble</strong><small>Build your own instrument lineup</small></button></div>'+(custom?'<h3>Choose instruments</h3><p class="note">Select individual instruments. Duplicate instruments can be added later in the notation editor.</p>'+groups+'<div class="toolbar"><button id="newt-add-pc">+ Piano Conductor (AUX / RH / LH)</button><button id="newt-clear">Clear</button></div><p class="note" id="newt-roster">'+esc(selection.join(' · ')||'No instruments selected')+'</p>':'')+'<div class="toolbar"><button class="primary" id="newt-confirm" '+(!selectedPreset&&!custom?'disabled':'')+'>Create chart blueprint</button><button id="newt-cancel">Cancel</button></div></div>':'')+'</div>';
 root.querySelector('#newt-create').onclick=()=>{open=!open;renderNewtMenu(root,handlers)};
 if(!open)return;
 root.querySelector('#newt-cancel').onclick=()=>{open=false;renderNewtMenu(root,handlers)};
 root.querySelectorAll('[data-preset]').forEach(el=>el.onclick=()=>{selectedPreset=el.dataset.preset;custom=selectedPreset==='other';selection=[...(PRESETS.find(p=>p.id===selectedPreset)?.parts||[])];renderNewtMenu(root,handlers)});
 root.querySelector('#newt-custom').onclick=()=>{selectedPreset='other';custom=true;renderNewtMenu(root,handlers)};
 root.querySelectorAll('[data-instrument]').forEach(el=>el.onchange=()=>{const name=el.dataset.instrument;selection=el.checked?cleanParts([...selection,name]):selection.filter(x=>x!==name);root.querySelector('#newt-roster').textContent=selection.join(' · ')||'No instruments selected'});
 root.querySelector('#newt-add-pc')?.addEventListener('click',()=>{selection=cleanParts([...selection,...PC]);renderNewtMenu(root,handlers)});
 root.querySelector('#newt-clear')?.addEventListener('click',()=>{selection=[];renderNewtMenu(root,handlers)});
 root.querySelector('#newt-confirm').onclick=()=>{const parts=cleanParts(selection);if(!parts.length){alert('Select at least one instrument.');return}handlers.onCreate({preset:selectedPreset,parts});open=false;selectedPreset='';custom=false;renderNewtMenu(root,handlers)};
}
