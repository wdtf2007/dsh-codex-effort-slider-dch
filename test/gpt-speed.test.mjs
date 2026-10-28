import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createDocument,createOfficialMenu,createFakeHost,createStore,loadBundle,settle} from './harness.mjs';
const bundlePath=fileURLToPath(new URL('../lib/client.js',import.meta.url));
const click=button=>button.dispatch('click',{stopPropagation(){}});

async function setup({provider='openai-codex',effort='max',writable=true,mode='standard',set}={}) {
 const doc=createDocument(),menu=createOfficialMenu(doc);
 const speedRow=doc.createElement('button');speedRow.className='codexModelSelectCell';speedRow.setAttribute('role','menuitem');
 for(const text of ['速度',mode==='standard'?'标准':'高速']){const span=doc.createElement('span');span.textContent=text;speedRow.appendChild(span);}
 if(provider==='openai-codex')menu.menu.appendChild(speedRow);
 const host=createFakeHost({model:{id:'test-gpt',reasoning:{defaultEffort:'medium',efforts:['low','medium','high','max'].map(id=>({id,name:id}))}},effort});
 const state=host.store.getSnapshot();state.current.provider=provider;state.groups[0].id=provider;
 const prefs=createStore({status:'ready',writable,saving:false,error:false,speedMode:mode,fastModels:['test-gpt'],ultrafastModels:[]});
 const writes=[];const controller={getSnapshot:prefs.getSnapshot,subscribe:prefs.subscribe,set:async patch=>{writes.push(patch);if(set)return set(patch,prefs);prefs.set({...prefs.getSnapshot(),...patch});}};
 let resolutions=0;
 host.ctx.slots.entries=()=>[{options:{id:'codex-subscription-quota'},inject:()=>{resolutions++;return {preference:controller}}}];
 const bundle=loadBundle(bundlePath,doc);bundle.plugin.apply(host.ctx);
 bundle.react.mount(host.registered[0].Component,{sessionId:'speed-session'},menu.composer);await settle();
 return {doc,menu,speedRow,host,prefs,writes,bundle,controller,get resolutions(){return resolutions}};
}
{
 const s=await setup();
 const root=s.bundle.react.find('root');
 assert.equal(root.getAttribute('data-flow'),'0','GPT Max standard has no fast flow');
 assert.ok(s.bundle.react.findAll('star').length>0,'Max retains suspended particles');
 const button=s.doc.querySelector('button[data-ces-part="speed-icon"]');
 assert.ok(button,'lightning is a real button');
 assert.equal(button.parentNode,s.menu.menu,'button must not be nested inside a native menuitem button');
 click(button);await settle();
 assert.deepEqual(s.writes,[{speedMode:'fast'}]);
 assert.equal(s.bundle.react.find('root').getAttribute('data-flow'),'1');
 assert.equal(s.host.selects.length,0,'speed write must not change reasoning effort');
 click(button);await settle();
 assert.deepEqual(s.writes.at(-1),{speedMode:'standard'});
 assert.equal(s.bundle.react.find('root').getAttribute('data-flow'),'0');
 s.bundle.react.unmount();
 assert.equal(s.doc.querySelectorAll('[data-ces-part="speed-icon"]').length,0);
}
for(const effort of ['low','medium','high','max']) {
 const s=await setup({effort,mode:'fast'});
 assert.equal(s.bundle.react.find('root').getAttribute('data-flow'),'1',effort+' fast flows');
 assert.ok(s.bundle.react.findAll('star').length>=6,effort+' fast has visible particles');
 assert.equal(s.bundle.react.find('stars').style.width,s.bundle.react.find('fill').style.width,'particles must be clipped to the illuminated region at every tier');
 const count=s.bundle.react.findAll('star').length;
 s.prefs.set({...s.prefs.getSnapshot(),speedMode:'standard'});await settle();
 assert.equal(s.bundle.react.find('root').getAttribute('data-flow'),'0',effort+' standard stops movement');
 assert.equal(s.bundle.react.findAll('star').length,count,'toggle preserves the particle nodes and their phases');
 if(effort!=='max')assert.equal(Number(s.bundle.react.find('stars').style.opacity),0,'ordinary standard tiers fade to plain');
 s.bundle.react.unmount();
}
{
 let rejectWrite;
 const s=await setup({set:(patch,prefs)=>new Promise(resolve=>{
  const before=prefs.getSnapshot();prefs.set({...before,...patch,saving:true,writable:false});
  rejectWrite=()=>{prefs.set({...before,error:true});resolve();};
 })});
 const button=s.doc.querySelector('button[data-ces-part="speed-icon"]');
 click(button);click(button);await settle();
 assert.equal(s.writes.length,1,'pending toggle is deduplicated');
 assert.equal(s.bundle.react.find('root').getAttribute('data-flow'),'0','optimistic preference must not start confirmed fast animation');
 rejectWrite();await settle();
 assert.equal(s.bundle.react.find('root').getAttribute('data-flow'),'0');
 assert.equal(button.getAttribute('aria-pressed'),'false');
 assert.ok(s.bundle.react.find('error'),'failed speed write is visible');
 s.bundle.react.unmount();
}
{
 const s=await setup({writable:false});
 const button=s.doc.querySelector('button[data-ces-part="speed-icon"]');
 assert.equal(button.disabled,true);click(button);await settle();assert.equal(s.writes.length,0);
 s.bundle.react.unmount();
}
{
 const s=await setup({provider:'deepseek'});
 assert.equal(s.resolutions,0,'DeepSeek must never resolve the Codex speed controller');
 assert.equal(s.bundle.react.find('root').getAttribute('data-flow'),null);
 s.bundle.react.unmount();
}
{
 const s=await setup();const button=s.doc.querySelector('button[data-ces-part="speed-icon"]');
 s.bundle.react.root.props.locked=true;s.host.store.set({...s.host.store.getSnapshot()});await settle();
 assert.equal(button.disabled,true,'a new conversation lock must immediately disable the speed button');
 click(button);await settle();assert.equal(s.writes.length,0,'locked state cannot use cached write permission');s.bundle.react.unmount();
}
{
 const s=await setup({mode:'ultrafast'});
 assert.equal(s.bundle.react.find('root').getAttribute('data-flow'),'0','unsupported global ultrafast is not the current model effective speed');
 assert.equal(s.doc.querySelector('button[data-ces-part="speed-icon"]').getAttribute('aria-pressed'),'false');
 s.bundle.react.unmount();
}
console.log('GPT speed button and particle regressions passed');
