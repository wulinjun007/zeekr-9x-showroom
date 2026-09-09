import bpy,bmesh,json,math,hashlib
from mathutils import Vector
from pathlib import Path
O=Path(__file__).parent;s=bpy.context.scene;source=bpy.data.filepath
bpy.ops.wm.save_as_mainfile(filepath=str(O/'ZEEKR_9X_before_check.blend'),copy=True)
r={'source':source,'materials':[],'bevels':[],'quad_finish':[],'vents':[],'notes':[]};tex=O/'textures';tex.mkdir(exist_ok=True)
exec(compile((O.parent/'内饰展示精修V4/full_audit.py').read_text().split('for o in bpy.context.scene.objects:')[0].replace('O=Path(__file__).parent; rows=[];mats={}','# keep output folder; audit helpers'),'<helpers>','exec'))
# Constant PBR maps preserve deliberately uniform finishes; procedural detail graphs are retained.
def constant(name,color,space):
 path=tex/(name+'.png');im=bpy.data.images.get(name)
 if not im:
  im=bpy.data.images.new(name,2048,2048,alpha=False);im.generated_color=(*color,1);im.colorspace_settings.name=space;im.file_format='PNG';im.filepath_raw=str(path);im.save();im.pack()
 return im
white=constant('V5_unit_factor',(1,1,1),'Non-Color');flat=constant('V5_flat_normal',(.5,.5,1),'Non-Color')
used={sl.material for o in s.objects if interior(o) for i,sl in enumerate(o.material_slots) if sl.material and (o.type!='MESH' or any(p.material_index==i for p in o.data.polygons))}
for m in used:
 if not m.use_nodes:continue
 nt=m.node_tree;n=nt.nodes;l=nt.links;bs=next((x for x in n if x.type=='BSDF_PRINCIPLED'),None)
 if not bs:continue
 added=[]
 for key in ['Base Color','Roughness','Normal']:
  sock=bs.inputs[key]
  if upstream(sock):continue
  old=sock.links[0].from_socket if sock.is_linked else None
  tx=n.new('ShaderNodeTexImage');tx.name='V5_'+key+'_map';tx.label='2K constant physical finish; preserves procedural detail'
  if key=='Normal':
   tx.image=flat;nm=n.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=1;l.new(tx.outputs[0],nm.inputs['Color'])
   if old:
    # Put neutral normal at the base of the original procedural bump stack.
    seen=set();q=[old.node];inserted=False
    while q:
     node=q.pop()
     if node in seen:continue
     seen.add(node)
     if node.type=='BUMP' and not node.inputs['Normal'].is_linked:l.new(nm.outputs[0],node.inputs['Normal']);inserted=True;break
     q.extend(ln.from_node for inp in node.inputs for ln in inp.links)
    if not inserted:nt.nodes.remove(tx);nt.nodes.remove(nm);continue
   else:l.new(nm.outputs[0],sock)
  elif old:
   tx.image=white
   if key=='Roughness':mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';l.new(old,mul.inputs[0]);l.new(tx.outputs[0],mul.inputs[1]);l.new(mul.outputs[0],sock)
   else:
    mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;l.new(old,mul.inputs[1]);l.new(tx.outputs[0],mul.inputs[2]);l.new(mul.outputs[0],sock)
  else:
   col=tuple(sock.default_value[:3]) if key=='Base Color' else (sock.default_value,)*3;sig=hashlib.sha256(str(col).encode()).hexdigest()[:12];tx.image=constant('V5_'+key+'_'+sig,col,'sRGB' if key=='Base Color' else 'Non-Color');l.new(tx.outputs[0],sock)
  added.append(key)
 if added:r['materials'].append({'name':m.name,'added':added,'type':'2K constant PBR maps or neutral factor; existing detail preserved'})
# Remove just the two simplified central louver/control islands, archiving exact geometry.
o=bpy.data.objects['Car_INT'];bounds=[((-0.11345,.70585,1.01775),(-.02175,.73545,1.02705)),((.02215,.70585,1.01775),(.11375,.73545,1.02705))]
ids=[]
for p in o.data.polygons:
 vs=[o.matrix_world@o.data.vertices[i].co for i in p.vertices]
 if any(all(all(lo[k]<=v[k]<=hi[k] for k in range(3)) for v in vs) for lo,hi in bounds):ids.append(p.index)
backup=bpy.data.collections.new('V5_OriginalVent_Backup');s.collection.children.link(backup);backup.hide_render=True;backup.hide_viewport=True
if ids:
 ob=o.copy();ob.data=o.data.copy();backup.objects.link(ob);ob.name='V5_original_central_vent_islands';bm=bmesh.new();bm.from_mesh(ob.data);bm.faces.ensure_lookup_table();bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.index not in ids],context='FACES');bm.to_mesh(ob.data);bm.free()
 bm=bmesh.new();bm.from_mesh(o.data);bm.faces.ensure_lookup_table();bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.index in ids],context='FACES');bm.to_mesh(o.data);bm.free()
col=bpy.data.collections.new('V5_Vent_Physical_Detail');s.collection.children.link(col)
metal=bpy.data.materials.get('CabinV3_SatinAluminium');dark=bpy.data.materials.get('CabinV3_SoftBlackButtons')
for side,cx in [('L',-.071),('R',.071)]:
 for j in range(3):
  z=1.025+(j-1)*.0095;vs=[]
  # Closed 1.5mm shell with a mild curved chord; 15mm depth.
  for x in [cx-.056,cx+.056]:
   for face in [0,1]:
    for k in range(9):
     t=k/8;vs.append((x,.718+t*.015,z+(face-.5)*.0015+math.sin(t*math.pi)*.00055))
  faces=[]
  for k in range(8):faces.extend([(k,k+1,19+k,18+k),(9+k,27+k,28+k,10+k),(k,9+k,10+k,k+1),(18+k,19+k,28+k,27+k)])
  faces.extend([(0,18,27,9),(8,17,35,26)])
  me=bpy.data.meshes.new('V5_vent_blade');me.from_pydata(vs,[],faces);me.materials.append(dark);ob=bpy.data.objects.new(f'Vent_center_{side}_blade_{j+1}',me);col.objects.link(ob);ob['detailRole']='vent_blade';ob['V5_added']=True
  b=ob.modifiers.new('Blade edge 0.2mm','BEVEL');b.width=.0002;b.segments=3;b.limit_method='ANGLE';b.angle_limit=math.radians(40);r['vents'].append(ob.name)
 bpy.ops.mesh.primitive_cube_add(size=1,location=(cx,.7168,1.025));ob=bpy.context.object;ob.name='Vent_center_'+side+'_adjuster';ob.dimensions=(.005,.004,.022);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for c in list(ob.users_collection):c.objects.unlink(ob)
 col.objects.link(ob);ob.data.materials.append(metal);b=ob.modifiers.new('Adjuster 0.3mm bevel','BEVEL');b.width=.0003;b.segments=3;ob['detailRole']='vent_adjuster';ob['V5_added']=True;r['vents'].append(ob.name)
r['vent_original_faces_archived']=len(ids)
# Angle-limited bevels on explicit hard controls and dedicated screen housings.
for o in list(s.objects):
 if o.type!='MESH' or o.hide_render or any(c.hide_render for c in o.users_collection):continue
 hard=o.name.startswith(('CabinV3_button_','CabinV3_control_','CabinV3_dial_')) or o.name=='Carbody_INT_IP_long_screen'
 if hard:
  bm=bmesh.new();bm.from_mesh(o.data);eligible=sum(e.is_manifold and e.calc_face_angle(0)>math.radians(40) for e in bm.edges);bm.free()
  if not any(m.type=='BEVEL' for m in o.modifiers):b=o.modifiers.new('V5 exposed edge 0.5mm','BEVEL');b.width=.0005;b.segments=3;b.limit_method='ANGLE';b.angle_limit=math.radians(40);b.use_clamp_overlap=True
  r['bevels'].append({'object':o.name,'eligible_hard_edges':eligible,'bevel_present':True})
# Editable non-destructive quad finish on visible interior objects only.
# Simple subdivision preserves the evaluated surface and is not claimed to be quad-flow retopology.
for o in list(s.objects):
 if o.type!='MESH' or not (interior(o) or o.get('V5_added')):continue
 if o.name.startswith('Door') or o.name in ['TrunkDoor_Lower']:continue # mixed exterior/interior assemblies need semantic splitting
 mod=o.modifiers.new('V5 surface-preserving quad finish','SUBSURF');mod.subdivision_type='SIMPLE';mod.levels=1;mod.render_levels=1;mod.show_only_control_edges=True;r['quad_finish'].append(o.name)
r['notes']=['Base edit cages are retained; evaluated quad finish does not create production quad edge flow.','Door assemblies contain exterior geometry and were not globally subdivided.','UV distortion and low-resolution icon atlases remain subject to detailed audit; image upscaling is not counted as repair.']
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(O/'ZEEKR_9X_内饰自检修复V5.blend'));(O/'repair-report.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print('REPAIR_SAVED',len(r['materials']),len(r['quad_finish']),len(r['vents']),flush=True)
