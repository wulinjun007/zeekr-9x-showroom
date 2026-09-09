import bpy,bmesh,json
from pathlib import Path
O=Path(__file__).parent;s=bpy.context.scene;o=bpy.data.objects['Car_INT'];hits=json.loads((O/'vent-contact-faces.json').read_text());ids={r['id'] for r in hits}
# Create clearance inside the existing outer frame, preserving its outer footprint.
for p in o.data.polygons:
 vs=[o.matrix_world@o.data.vertices[i].co for i in p.vertices]
 if all(-.1295<=v.x<=.130 and .717<=v.y<=.752 and 1.009<=v.z<=1.042 for v in vs):ids.add(p.index)
backup=bpy.data.collections['V5_OriginalVent_Backup'];copy=o.copy();copy.data=o.data.copy();copy.name='V5_original_vent_internal_faces';backup.objects.link(copy)
bm=bmesh.new();bm.from_mesh(copy.data);bm.faces.ensure_lookup_table();bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.index not in ids],context='FACES');bm.to_mesh(copy.data);bm.free()
bm=bmesh.new();bm.from_mesh(o.data);bm.faces.ensure_lookup_table();bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.index in ids],context='FACES');bm.to_mesh(o.data);bm.free()
# Four inset cavity walls + back, all quads; front deliberately open for the new slats.
x0,x1=-.1288,.1293;y0,y1=.717,.751;z0,z1=1.0097,1.0414
vs=[(x,y,z) for y in [y0,y1] for z in [z0,z1] for x in [x0,x1]]
faces=[(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3),(4,6,7,5)]
me=bpy.data.meshes.new('V5 inset vent cavity');me.from_pydata(vs,[],faces);me.materials.append(bpy.data.materials['V5_Vent_SoftBlack']);ob=bpy.data.objects.new('Vent_center_cavity',me);bpy.data.collections['V5_Vent_Physical_Detail'].objects.link(ob);ob['V5_added']=True
uv=me.uv_layers.new(name='UVMap')
for p in me.polygons:
 for i,li in enumerate(p.loop_indices):uv.data[li].uv=[(0,0),(1,0),(1,1),(0,1)][i]
r=json.loads((O/'repair-report.json').read_text());r['vents'].append(ob.name);r['vent_interference_fix']={'archived_inner_faces':len(ids),'new_cavity':ob.name,'outer_frame_bounds_preserved':True};(O/'repair-report.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));bpy.ops.wm.save_as_mainfile(filepath=str(O/'ZEEKR_9X_内饰自检修复V5.blend'));print('CAVITY_FIXED',len(ids),flush=True)
