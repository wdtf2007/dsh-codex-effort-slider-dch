import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createDocument,createOfficialMenu,loadBundle,createFakeHost,settle} from './harness.mjs';
const path=fileURLToPath(new URL('../lib/client.js',import.meta.url));
function fixture() {
  const doc=createDocument(), menu=createOfficialMenu(doc);
  const row=doc.createElement('button'); row.setAttribute('role','menuitem');
  row.className='codexModelSelectCell';
  for(const text of ['速度','标准']) {const s=doc.createElement('span');s.textContent=text;row.appendChild(s);}
  menu.menu.appendChild(row);
  const bundle=loadBundle(path,doc);
  return {doc,menu,row,bundle,i:bundle.plugin.__internals};
}
{
  const {doc,menu,i}=fixture();
  assert.equal(i.findEffortRow(doc,menu.composer),menu.effortRow,'subscription third row must not hide effort slider');
  const fourth=doc.createElement('button');fourth.setAttribute('role','menuitem');menu.menu.appendChild(fourth);
  assert.equal(i.findEffortRow(doc,menu.composer),menu.effortRow,'verbosity fourth row supported');
  menu.effortLabelEl.textContent='unknown';
  assert.equal(i.findEffortRow(doc,menu.composer),null,'unknown extended menu must remain native');
}
{
  const {doc,menu,row,i}=fixture();let host;
  const bridge=i.createMenuBridge({doc,win:{},anchor:()=>menu.composer,active:()=>true,onChange:v=>host=v});
  bridge.scan();assert.ok(host,'slider host attached');
  let bolt=row.querySelectorAll('[data-ces-part="speed-icon"]')[0];
  assert.ok(bolt,'speed icon exists on native speed row');
  assert.equal(bolt.getAttribute('data-speed'),'standard');
  row.children[1].textContent='高速';bridge.scan();
  assert.equal(bolt.getAttribute('data-speed'),'fast');
  row.children[1].textContent='极速 Beta';bridge.scan();
  assert.equal(bolt.getAttribute('data-speed'),'ultrafast');
  row.children[1].textContent='未知';bridge.scan();
  assert.equal(row.querySelectorAll('[data-ces-part="speed-icon"]').length,0,'unknown speed never invented');
  row.children[1].textContent='Standard';bridge.scan();
  assert.equal(row.querySelectorAll('[data-ces-part="speed-icon"]').length,1);
  host.container.remove();bridge.scan();
  assert.ok(menu.effortRow.contains(host.container),'native rerender removing portal host must repair attachment');
  const label=doc.createElement('span');label.textContent='恢复';host.container.appendChild(label);
  const stableHost=host.container;bridge.scan();
  assert.equal(host.container===stableHost,true,'injected control label must not be mistaken for native effort value');
  bridge.dispose();assert.equal(row.querySelectorAll('[data-ces-part="speed-icon"]').length,0);
  assert.equal(menu.effortRow.style.height,'');
}
{
  const {i}=fixture();
  assert.equal(i.codexAdvanced({id:'high',name:'高'}),false);
  assert.equal(i.codexAdvanced({id:'xhigh',name:'极高'}),false);
  assert.equal(i.codexAdvanced({id:'ultra',name:'Ultra'}),true);
  assert.equal(i.codexAdvanced({id:'max',name:'最高'}),true);
}
async function mounted(select) {
  const f=fixture(),host=createFakeHost({model:{id:'catalog-model',reasoning:{defaultEffort:'medium',efforts:[{id:'low',name:'轻度'},{id:'medium',name:'中'},{id:'high',name:'高'},{id:'ultra',name:'Ultra'}]}},select});
  const state=host.store.getSnapshot();state.current.provider='openai-codex';state.groups[0].id='openai-codex';
  f.bundle.plugin.apply(host.ctx);
  f.bundle.react.mount(host.registered[0].Component,{sessionId:'session-test'},f.menu.composer);
  await settle();return {...f,host};
}
{
 const f=await mounted();const r=f.bundle.react;
 assert.equal(r.find('track').getAttribute('aria-valuemax'),'3');
 r.find('track').fire('onKeyDown',{key:'End'});await settle();
 assert.equal(f.host.selects.at(-1).reasoningEffort,'ultra','exact catalog ID written');
 r.find('reset').fire('onClick',{});await settle();
 assert.equal(f.host.selects.at(-1).reasoningEffort,'medium','real catalog default selected');
 assert.equal(f.row.children[1].textContent,'标准','effort never toggles speed');
 r.unmount();
}
{
 let resolve;
 const f=await mounted(()=>new Promise(r=>resolve=r));const r=f.bundle.react;
 r.find('track').fire('onKeyDown',{key:'End'});await settle();
 r.find('track').fire('onKeyDown',{key:'Home'});await settle();
 const s=f.host.store.getSnapshot();
 f.host.store.set({...s,current:{provider:'deepseek',model:'other',reasoningEffort:'high'},groups:[{id:'deepseek',models:[{id:'other',reasoning:{defaultEffort:'high',efforts:[{id:'low',name:'Low'},{id:'high',name:'High'}]}}]}]});await settle();
 resolve({ok:true});await settle();
 assert.equal(f.host.selects.length,1,'queued old-model effort must not write into new model');
 assert.equal(r.find('track').getAttribute('aria-valuetext'),'High');r.unmount();
}
{
 const f=fixture(),host=createFakeHost();f.bundle.plugin.apply(host.ctx);
 f.bundle.react.mount(host.registered[0].Component,{sessionId:'deepseek-cache'},f.menu.composer);await settle();
 host.store.set({...host.store.getSnapshot(),groups:[]});await settle();
 f.bundle.react.find('track').fire('onKeyDown',{key:'End'});await settle();
 assert.equal(host.selects.at(-1)?.reasoningEffort,'max','preserve DeepSeek transient catalog cache write behavior');
 f.bundle.react.unmount();
}
{
 const {doc,bundle}=fixture();const cleanups=[];const host=createFakeHost();
 host.ctx.effect=fn=>{const cleanup=fn();if(typeof cleanup==='function')cleanups.push(cleanup)};
 bundle.plugin.apply(host.ctx);
 assert.ok(doc.documentElement.listeners.get('contextmenu')?.size);
 cleanups.forEach(f=>f());
 assert.equal(doc.documentElement.listeners.get('contextmenu')?.size??0,0,'plugin disposal removes global settings handlers');
}
{
 const f=await mounted();const s=f.host.store.getSnapshot();
 f.host.store.set({...s,groups:[]});await settle();
 assert.equal(f.bundle.react.find('track'),null,'missing live Codex capabilities restore native menu');
 f.bundle.react.unmount();
}
{
 const f=await mounted();const s=f.host.store.getSnapshot();
 f.host.store.set({...s,current:{...s.current,reasoningEffort:'not-in-catalog'}});await settle();
 assert.equal(f.bundle.react.find('track'),null,'unknown current Codex effort must never fabricate a slider position');
 f.bundle.react.unmount();
}
console.log('Subscription compatibility regressions passed');
{
 const f=fixture(),host=createFakeHost({model:{id:'codex-default',reasoning:{efforts:[{id:'low',name:'Low'},{id:'max',name:'Max'}]}}});
 const s=host.store.getSnapshot();s.current.provider='openai-codex';s.groups[0].id='openai-codex';
 f.bundle.plugin.apply(host.ctx);f.bundle.react.mount(host.registered[0].Component,{sessionId:'provider-default'},f.menu.composer);await settle();
 assert.ok(f.bundle.react.find('track'),'native provider-default selection must still have a usable slider');
 assert.equal(f.bundle.react.find('track').getAttribute('aria-valuetext'),'默认');
 assert.equal(f.bundle.react.find('track').getAttribute('aria-valuemax'),'2','actual native default plus two explicit efforts');
 f.bundle.react.find('track').fire('onKeyDown',{key:'End'});await settle();
 assert.equal(host.selects.at(-1).reasoningEffort,'max');
 f.bundle.react.find('reset').fire('onClick',{});await settle();
 assert.equal(host.selects.at(-1).reasoningEffort,undefined,'native provider default clears override without sending synthetic ID');
 assert.equal(Object.hasOwn(host.selects.at(-1),'reasoningEffort'),false,'match native clearing operation by omitting effort property');
 for(let frame=0;frame<100;frame++){f.bundle.flushFrames(1);await settle();}
 assert.equal(f.bundle.react.find('track').getAttribute('aria-valuetext'),'默认');
 f.bundle.react.unmount();
}
