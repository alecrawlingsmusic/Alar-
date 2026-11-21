// Live MusicXML preview for Newt. The XML is generated from the current draft.
let toolkitPromise;
let viewerOpen=false,viewerMode='score';
const timeout=(promise,ms,label)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+' timed out after '+Math.round(ms/1000)+' seconds')),ms))]);
const getToolkit=()=>{
 if(!toolkitPromise)toolkitPromise=new Promise((resolve,reject)=>{
  const ready=()=>{
   const api=window.verovio;
   if(!api?.toolkit||!api?.module){reject(new Error('Verovio browser library did not initialize'));return}
   const mod=api.module;
   if(mod.calledRun||mod.runtimeInitialized||mod._vrvToolkit_constructor){resolve(api);return}
   const previous=mod.onRuntimeInitialized;
   mod.onRuntimeInitialized=()=>{if(typeof previous==='function')previous();resolve(api)};
  };
  if(window.verovio?.module){ready();return}
  const script=document.createElement('script');
  script.src='https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js';
  script.async=true;
  script.onload=ready;
  script.onerror=()=>reject(new Error('Unable to download Verovio from verovio.org'));
  document.head.appendChild(script);
 }).catch(err=>{toolkitPromise=null;throw err});
 return toolkitPromise;
};
const escapeHtml=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export function mountXmlViewer(root,getXml){
 let open=viewerOpen,mode=viewerMode,page=1,tk=null,lastXml='',revision=0;
 const panel=document.createElement('section');
 panel.className='xml-viewer';
 panel.innerHTML='<button type="button" class="xml-viewer-toggle" aria-expanded="false">♬ Preview MusicXML score</button><div class="xml-viewer-content" hidden><div class="xml-viewer-bar"><div class="xml-viewer-tabs"><button type="button" data-xml-mode="score" class="active">Engraved score</button><button type="button" data-xml-mode="source">MusicXML source</button></div><button type="button" data-xml-refresh>↻ Refresh</button></div><p class="xml-viewer-status" role="status"></p><div class="xml-viewer-output"></div><div class="xml-viewer-pages"><button type="button" data-xml-prev>← Previous</button><span class="xml-viewer-count"></span><button type="button" data-xml-next>Next →</button></div><p class="note">Preview shows the current exported MusicXML. Newt currently exports a structural score with rests, rehearsal marks and basic chord symbols; lyric and vocal-rhythm engraving is not yet implemented.</p></div>';
 root.appendChild(panel);
 panel.querySelector('.xml-viewer-content').hidden=!open;
 panel.querySelector('.xml-viewer-toggle').setAttribute('aria-expanded',String(open));
 panel.querySelectorAll('[data-xml-mode]').forEach(b=>b.classList.toggle('active',b.dataset.xmlMode===mode));
 const $=s=>panel.querySelector(s),status=$('.xml-viewer-status'),output=$('.xml-viewer-output'),pages=$('.xml-viewer-pages');
 async function update(){
  if(!open)return;
  const version=++revision;
  let xml;
  try{if(typeof getXml!=='function')throw new Error('MusicXML generator is not connected');xml=getXml();if(typeof xml!=='string'||!xml.includes('<score-partwise'))throw new Error('Generator did not return a MusicXML score')}catch(e){status.textContent='Unable to generate MusicXML: '+e.message;output.innerHTML='';pages.hidden=true;return}
  if(mode==='source'){
   status.textContent='Generated MusicXML source · '+new Blob([xml]).size+' bytes';
   output.innerHTML='<pre class="xml-viewer-source"><code>'+escapeHtml(xml)+'</code></pre>';
   pages.hidden=true;return;
  }
  pages.hidden=true;
  status.textContent='Loading score renderer…';output.innerHTML='';
   try{
   const api=await timeout(getToolkit(),25000,'Verovio loading');if(version!==revision)return;
   if(!tk)tk=new api.toolkit();
   if(xml!==lastXml){tk.setOptions({scale:38,pageWidth:1250,adjustPageHeight:true,breaks:'auto'});tk.loadData(xml);lastXml=xml;page=1}
   status.textContent='Engraving score…';
   const count=Math.max(1,tk.getPageCount());page=Math.min(page,count);
   const svg=tk.renderToSVG(page,{});
   if(version!==revision)return;
   if(!svg||!svg.includes('<svg'))throw new Error('Renderer returned no notation');
   output.innerHTML='<div class="xml-viewer-sheet">'+svg+'</div>';
   pages.hidden=false;
   status.textContent='Rendered from the current arrangement';
   $('.xml-viewer-count').textContent='Page '+page+' of '+count;
   $('[data-xml-prev]').disabled=page<=1;$('[data-xml-next]').disabled=page>=count;
  }catch(e){if(version===revision){status.textContent='Engraving unavailable: '+e.message+'. Showing MusicXML source instead.';mode='source';viewerMode='source';panel.querySelectorAll('[data-xml-mode]').forEach(x=>x.classList.toggle('active',x.dataset.xmlMode==='source'));output.innerHTML='<pre class="xml-viewer-source"><code>'+escapeHtml(xml)+'</code></pre>';pages.hidden=true}}
 }
 $('.xml-viewer-toggle').onclick=()=>{open=!open;viewerOpen=open;$('.xml-viewer-content').hidden=!open;$('.xml-viewer-toggle').setAttribute('aria-expanded',String(open));if(open)update()};
 panel.querySelectorAll('[data-xml-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.xmlMode;viewerMode=mode;panel.querySelectorAll('[data-xml-mode]').forEach(x=>x.classList.toggle('active',x===b));update()});
 $('[data-xml-refresh]').onclick=()=>{lastXml='';update()};
 $('[data-xml-prev]').onclick=()=>{page=Math.max(1,page-1);update()};
 $('[data-xml-next]').onclick=()=>{page++;update()};
 if(open)update();
 return {refresh:update};
}
