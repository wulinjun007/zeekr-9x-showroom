import bpy,json,hashlib
from pathlib import Path
O=Path(__file__).parent;s=bpy.context.scene
# Correct unassigned new blades with a real soft-black physical material.
m=bpy.data.materials.new('V5_Vent_SoftBlack');m.use_nodes=True;bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');bs.inputs['Base Color'].default_value=(.018,.022,.026,1);bs.inputs['Roughness'].default_value=.62;bs.inputs['Metallic'].default_value=0;bs.inputs['Specular IOR Level'].default_value=.22
for o in s.objects:
 if o.name.startswith('Vent_center_') and '_blade_' in o.name:o.data.materials.clear();o.data.materials.append(m)
# Reuse audited PBR completion logic for the newly included mixed body and vent materials.
code=(O/'repair.py').read_text();start=code.index('def constant(');end=code.index('# Remove just')
helpers=(O.parent/'内饰展示精修V4/full_audit.py').read_text().split('for o in bpy.context.scene.objects:')[0];exec(compile(helpers.replace('O=Path(__file__).parent; rows=[];mats={}','# preserve output'),'<helper>','exec'))
def interior(o):return o.type in ('MESH','CURVE') and not o.hide_render and not any(c.hide_render for c in o.users_collection)
r={'materials':[]};tex=O/'textures';exec(compile(code[start:end],'<completion>','exec'));(O/'final-material-repairs.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
# UV cleanup after the final bevel/subdivision evaluation. Original label/atlas UVs stay intact.
native_cache={}
def atlas(m):
 if not m:return False
 if m.name in native_cache:return native_cache[m.name]
 result=bool(m.use_nodes and any(n.type=='TEX_IMAGE' and n.image and (n.image.name.startswith(('9X','INT_','int1','int2','screen.jpg')) or n.image.name in ['center_display_3K.png','instrument_2K.png']) for n in m.node_tree.nodes));native_cache[m.name]=result;return result
rows=[]
for o in s.objects:
 if o.type!='MESH' or not interior(o):continue
 if o.name not in {r['object'] for r in json.loads((O/'quad-report.json').read_text())}:continue
 me=o.data;uv=me.uv_layers.active or me.uv_layers.new(name='UVMap');changed=0
 for p in me.polygons:
  mat=o.material_slots[p.material_index].material if p.material_index<len(o.material_slots) else None
  if atlas(mat):continue
  vs=[o.matrix_world@me.vertices[i].co for i in p.vertices];u=(vs[1]-vs[0]).normalized();n=(vs[1]-vs[0]).cross(vs[2]-vs[0]).normalized();v=n.cross(u).normalized()
  if n.length<.5:continue
  for li,co in zip(p.loop_indices,vs):uv.data[li].uv=(co.dot(u)/.12,co.dot(v)/.12)
  changed+=1
 rows.append({'object':o.name,'faces_uv_repaired':changed})
(O/'post-evaluation-uv.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(O/'ZEEKR_9X_内饰自检修复V5.blend'));print('FINAL_REPAIRS',len(r['materials']),len(rows),flush=True)
