import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector
O=Path(__file__).parent;s=bpy.context.scene;rows=[];r=json.loads((O/'repair-report.json').read_text())
def native_atlas(m):
 return bool(m and m.use_nodes and any(n.type=='TEX_IMAGE' and n.image and (n.image.name.startswith(('9X','INT_','int1','int2','screen.jpg')) or n.image.name in ['center_display_3K.png','instrument_2K.png']) for n in m.node_tree.nodes))
for o in s.objects:
 if o.type!='MESH' or o.hide_render or any(c.hide_render for c in o.users_collection):continue
 if not any(mod.name.startswith('V5') for mod in o.modifiers) and not o.name.startswith('Door'):continue
 me=o.data;uv=me.uv_layers.active or me.uv_layers.new(name='UVMap');changed=0
 for p in me.polygons:
  m=o.material_slots[p.material_index].material
  if native_atlas(m):continue
  coords=[o.matrix_world@me.vertices[i].co for i in p.vertices]
  if len(coords)<3:continue
  u=(coords[1]-coords[0]).normalized();n=(coords[1]-coords[0]).cross(coords[2]-coords[0]).normalized();v=n.cross(u).normalized()
  if n.length<.5:continue
  for li,co in zip(p.loop_indices,coords):uv.data[li].uv=(co.dot(u)/.12,co.dot(v)/.12)
  changed+=1
 # Rebuild the actual tiled detail channel from tangent planes, preserving the original atlas channel.
 if 'V4_MicroUV' in me.uv_layers:
  detail=me.uv_layers['V4_MicroUV']
  for p in me.polygons:
   coords=[o.matrix_world@me.vertices[i].co for i in p.vertices];u=(coords[1]-coords[0]).normalized();n=(coords[1]-coords[0]).cross(coords[2]-coords[0]).normalized();v=n.cross(u).normalized()
   if n.length<.5:continue
   for li,co in zip(p.loop_indices,coords):detail.data[li].uv=(co.dot(u)/.12,co.dot(v)/.12)
 if changed:rows.append({'object':o.name,'faces_reprojected':changed,'atlas_uv_preserved':True})
 # Weight only hard-material manifold edges; never bevel stitched fabric, upholstery or exterior paint.
 if o.name in ['Car_INT','Door_LF_WG','Door_RF_WG','Door_LB_INT_6S','Door_RB_INT_6S']:
  bm=bmesh.new();bm.from_mesh(me);bm.edges.ensure_lookup_table();weight=me.attributes.get('bevel_weight_edge') or me.attributes.new('bevel_weight_edge','FLOAT','EDGE');count=0
  for e in bm.edges:
   hard=False
   if e.is_manifold and e.calc_face_angle(0)>math.radians(40):
    ms=[o.material_slots[f.material_index].material for f in e.link_faces]
    hard=all(m and any(t in m.name for t in ['Dashboard','Trim','Piano','Black_1']) and not any(t in m.name for t in ['Leather','leather','Headliner','fabric']) for m in ms)
   weight.data[e.index].value=1.0 if hard else 0.0;count+=int(hard)
  bm.free()
  if count:
   mod=o.modifiers.new('V5 selected hard edges 1mm','BEVEL');mod.width=.001;mod.segments=3;mod.limit_method='WEIGHT';mod.use_clamp_overlap=True
   # Finish quads after the bevel, not before it.
   finish=next((m for m in o.modifiers if 'quad finish' in m.name),None)
   if finish:o.modifiers.move(o.modifiers.find(mod.name),o.modifiers.find(finish.name))
   r['bevels'].append({'object':o.name,'eligible_hard_edges':count,'method':'material-filtered weights; 1mm; 3 segments'})
(O/'uv-repairs.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));(O/'repair-report.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));bpy.ops.wm.save_as_mainfile(filepath=str(O/'ZEEKR_9X_内饰自检修复V5.blend'));print('UV_REPAIRED',len(rows))
