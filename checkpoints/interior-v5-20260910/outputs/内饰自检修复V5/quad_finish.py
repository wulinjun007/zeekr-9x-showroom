import bpy,json
from pathlib import Path
O=Path(__file__).parent;s=bpy.context.scene;rows=[]
# Preserve the editable modifier-based revision separately before converting evaluated surfaces.
bpy.ops.wm.save_as_mainfile(filepath=str(O/'ZEEKR_9X_V5_可编辑修改器.blend'),copy=True)
for o in list(s.objects):
 if o.type!='MESH' or o.hide_render or any(c.hide_render for c in o.users_collection):continue
 used={p.material_index for p in o.data.polygons};interior=o.name.startswith(('CabinV','Vent_center','Seat_','Backrest_','Car_INT','Carbody_INT','CMF_Floor')) or any(o.material_slots[i].material and any(k in o.material_slots[i].material.name for k in ['V4_','CabinV2_']) for i in used)
 if not interior:continue
 if not any('quad finish' in m.name for m in o.modifiers):
  mod=o.modifiers.new('V5 surface-preserving quad finish','SUBSURF');mod.subdivision_type='SIMPLE';mod.levels=1;mod.render_levels=1
 # Evaluate at the existing render subdivision level before preserving the surface.
 for m in o.modifiers:
  if m.type=='SUBSURF' and 'quad finish' not in m.name:m.levels=m.render_levels
 bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();ev=o.evaluated_get(dg);me=bpy.data.meshes.new_from_object(ev,preserve_all_data_layers=True,depsgraph=dg);me.name=o.data.name+'_V5_Quads'
 bad=sum(len(p.vertices)!=4 for p in me.polygons)
 if bad:rows.append({'object':o.name,'status':'unresolved','nonquads':bad});bpy.data.meshes.remove(me);continue
 before=len(o.data.polygons);o.modifiers.clear();o.data=me
 rows.append({'object':o.name,'source_faces':before,'quad_faces':len(me.polygons),'nonquads':bad,'note':'Surface-preserving subdivision, not optimized quad retopology'})
(O/'quad-report.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(O/'ZEEKR_9X_内饰自检修复V5.blend'));print('QUADS_SAVED',len(rows),sum(r.get('quad_faces',0) for r in rows),flush=True)
