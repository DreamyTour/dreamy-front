/** Real Strapi + disposable SQLite; never boots the user's CMS or reads its .env. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire, Module } from 'node:module';
import ts from 'typescript';
const front = process.cwd();
const cms = path.resolve(front, '../dreamy-cms');
const requireCms = createRequire(path.join(cms, 'package.json'));
const loadTs = (file) => {
  const module = new Module(file);
  module.filename = file; module.paths = Module._nodeModulePaths(path.dirname(file));
  module.require = function(name) {
    if (name.startsWith('.') && !path.extname(name)) return loadTs(path.resolve(path.dirname(file), name + '.ts'));
    return createRequire(file)(name);
  };
  module._compile(ts.transpileModule(requireCms('node:fs').readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText, file);
  return module.exports;
};
const protection = loadTs(path.join(cms, 'src/extensions/tour-route-protection.ts'));
const { createStrapi } = requireCms('@strapi/strapi');
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'dreamy-route-safety-'));
await fs.mkdir(path.join(temp, 'public/uploads'), { recursive: true });
const write = async (file, data) => { const target = path.join(temp, file); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, typeof data === 'string' ? data : JSON.stringify(data)); };
await write('package.json', { name: 'route-safety-isolated', version: '1.0.0', dependencies: {} });
await write('config/database.js', `module.exports={connection:{client:'sqlite',connection:{filename:${JSON.stringify(path.join(temp, 'fixture.db'))}},useNullAsDefault:true}};`);
await write('config/server.js', "module.exports={host:'127.0.0.1',port:0,app:{keys:['isolated-test-key-one','isolated-test-key-two']}};");
await write('config/admin.js', "module.exports={serveAdminPanel:false,auth:{secret:'isolated-admin-secret'},apiToken:{salt:'isolated-api-token'},transfer:{token:{salt:'isolated-transfer-token'}},secrets:{encryptionKey:'isolated-encryption-key'}};");
await write('config/plugins.js', 'module.exports={};');
await write('config/middlewares.js', "module.exports=['strapi::errors','strapi::security','strapi::cors','strapi::body','strapi::query','strapi::favicon','strapi::public'];");
await write('src/api/tour/content-types/tour/schema.json', { kind: 'collectionType', collectionName: 'tours', info: { singularName: 'tour', pluralName: 'tours', displayName: 'Isolated tour' }, options: { draftAndPublish: true }, attributes: { titulo: { type: 'string' }, tab: { type: 'component', component: 'tours.tabs' } } });
await write('src/components/tours/tabs.json', { collectionName: 'test_tabs', info: { displayName: 'Tabs' }, attributes: { maps: { type: 'component', component: 'tours.maps' } } });
await write('src/components/tours/maps.json', { collectionName: 'test_maps', info: { displayName: 'Maps' }, attributes: { mapstops: { type: 'component', repeatable: true, component: 'shared.map-stops' } } });
await write('src/components/shared/map-stops.json', { collectionName: 'test_stops', info: { displayName: 'Day' }, attributes: { order: { type: 'integer' }, title: { type: 'string' }, routePlan: { type: 'customField', customField: 'global::tour-route-plan' } } });
await write('src/index.js', "module.exports={register({strapi}){strapi.customFields.register({name:'tour-route-plan',type:'json'});globalThis.__routeFixtureRegister(strapi);}};");
// Fail closed if any external DB variables could affect the isolated configuration.
const oldCwd = process.cwd();
process.chdir(temp);
const app = createStrapi({ appDir: temp, distDir: temp, autoReload: false, serveAdminPanel: false });
let count = 0;
try {
  globalThis.__routeFixtureRegister = protection.registerTourRouteProtection;
  await app.load();
  delete globalThis.__routeFixtureRegister;
  const repository = app.documents('api::tour.tour');
  const populate = { tab: { populate: { maps: { populate: { mapstops: true } } } } };
  const plan = (day, mode = 'bus') => ({ version: 1, dayId: `day-${day}`, start: { label: 'Origen', coordinates: [-72.27,-13.26] }, legs: [{ id: `leg-${day}`, mode, destination: { label: 'Destino', coordinates: [-72.51,-13.18] }, geometry: [[-72.27,-13.26],[-72.4,-13.2],[-72.51,-13.18]], provider: 'GPX verificado por el editor', geometryMeta: { source: 'gpx', fileName: `day-${day}.gpx`, status: 'valid', mode } }] });
  let document = await repository.create({ data: { titulo: 'DISPOSABLE TEST ONLY', tab: { maps: { mapstops: [{ order: 1, title: 'Day 1', routePlan: plan(1,'train') }, { order: 2, title: 'Day 2', routePlan: plan(2) }] } } }, populate });
  const id = document.documentId;
  const read = () => repository.findOne({ documentId: id, status: 'draft', populate });
  const getDays = doc => doc.tab.maps.mapstops;
  const update = next => repository.update({ documentId: id, data: { tab: next.tab }, populate });
  assert.equal(getDays(await read())[0].routePlan.legs[0].geometry.length,3); count++;
  const originalDay1 = structuredClone(getDays(document)[0].routePlan);
  let next = structuredClone(document);
  const day2 = getDays(next)[1].routePlan;
  day2._baseRevision = protection.routeRevision(day2); day2.legs[0].destination.label = 'Day 2 edited';
  await update(next); document = await read();
  assert.deepEqual(getDays(document)[0].routePlan, originalDay1); count++;
  assert.equal(getDays(document)[1].routePlan.legs[0].destination.label, 'Day 2 edited'); count++;
  next = structuredClone(document);
  const dropping = getDays(next)[0].routePlan; dropping._baseRevision = protection.routeRevision(dropping); delete dropping.legs[0].geometry;
  await assert.rejects(update(next), /eliminaría un trazado/); count++;
  assert.deepEqual(getDays(await read())[0].routePlan, originalDay1); count++;
  await assert.rejects(repository.update({ documentId: id, data: { tab: {} } }), /omitiendo sus recorridos/); count++;
  await assert.rejects(repository.update({ documentId: id, data: { tab: { id: document.tab.id, maps: {} } } }), /omitiendo sus días/); count++;
  const stale = structuredClone(document);
  next = structuredClone(document);
  const changing = getDays(next)[0].routePlan; changing._baseRevision = protection.routeRevision(changing); changing.start.label = 'New saved name';
  await update(next);
  const stalePlan = getDays(stale)[0].routePlan; stalePlan._baseRevision = protection.routeRevision(stalePlan); stalePlan.start.label = 'Old browser name';
  await assert.rejects(update(stale), /Otra versión/); count++;
  document = await read();
  next = structuredClone(document);
  const replacement = getDays(next)[0].routePlan;
  replacement._baseRevision = protection.routeRevision(replacement);
  replacement.archivedLegs = [structuredClone(replacement.legs[0])];
  replacement.legs[0].geometry = [[-72.27,-13.26],[-72.42,-13.21],[-72.51,-13.18]];
  await update(next); document = await read();
  assert.deepEqual(getDays(document)[0].routePlan.archivedLegs[0].geometry, originalDay1.legs[0].geometry); count++;
  assert.equal(getDays(document)[0].routePlan._baseRevision, undefined); count++;
  await repository.publish({ documentId: id });
  const published = await repository.findOne({ documentId: id, status: 'published', populate });
  assert.deepEqual(getDays(published)[0].routePlan, getDays(document)[0].routePlan); count++;
  next = structuredClone(document); getDays(next).splice(0,1);
  await assert.rejects(update(next), /eliminar un día/); count++;
  // Two writers sharing a base revision: at most one may commit.
  const candidates = ['writer-A','writer-B'].map(label => { const doc=structuredClone(document); const p=getDays(doc)[1].routePlan; p._baseRevision=protection.routeRevision(p); p.start.label=label; return doc; });
  const results = await Promise.allSettled(candidates.map(update));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1); count++;
  assert.equal(results.filter(r=>r.status==='rejected').length,1); count++;
  assert.deepEqual(getDays(await read())[0].routePlan, getDays(document)[0].routePlan); count++;
  // Legacy GPX without metadata can acquire a name without being treated as data loss.
  const legacy = plan('legacy','train'); delete legacy.legs[0].geometryMeta;
  const legacyDoc = await repository.create({ data: { titulo:'LEGACY FIXTURE', tab:{maps:{mapstops:[{order:1,title:'Legacy',routePlan:legacy}]}} }, populate });
  const legacyNext=structuredClone(legacyDoc);const legacyPlan=getDays(legacyNext)[0].routePlan;
  legacyPlan._baseRevision=protection.routeRevision(legacyPlan);
  legacyPlan.legs[0].geometryMeta={source:'gpx',fileName:'reimported.gpx'};
  await repository.update({documentId:legacyDoc.documentId,data:{tab:legacyNext.tab},populate});
  const legacyRead=await repository.findOne({documentId:legacyDoc.documentId,status:'draft',populate});
  assert.equal(getDays(legacyRead)[0].routePlan.legs[0].geometryMeta.fileName,'reimported.gpx');count++;
  console.log(JSON.stringify({ result: 'PASS', assertions: count, realStrapi: true, database: path.join(temp,'fixture.db'), productionAccess: false, cases: ['save and reread','day isolation','silent loss rejected','stale revision rejected','archive preserved','publish preserves routes','day deletion blocked','concurrent writers serialized'] },null,2));
} finally {
  await app.destroy();
  process.chdir(oldCwd);
}
