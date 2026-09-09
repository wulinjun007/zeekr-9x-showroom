import bpy,json,numpy as np
from pathlib import Path
O=Path(__file__).parent;s=bpy.context.scene
before=json.loads((O/'before-audit.json').read_text());fix=json.loads((O/'repair-report.json').read_text());names={o['name'] for o in before['objects']}|{o['object'] for o in json.loads((O/'quad-report.json').read_text())}|set(fix['vents']);objects=[];materials={}
def upstream(sock,seen=None):
 seen=set() if seen is None else seen;out=[]
 for link in sock.links:
  n=link.from_node
  if n in seen:continue
  seen.add(n)
  if n.type=='TEX_IMAGE' and n.image:out.append({'image':n.image.name,'size':list(n.image.size),'packed':bool(n.image.packed_file)})
  for inp in n.inputs:out+=upstream(inp,seen)
 return out
for name in sorted(names):
 o=bpy.data.objects.get(name)
 if not o or o.hide_render or any(c.hide_render for c in o.users_collection):continue
 row={'name':name,'type':o.type}
 if o.type=='CURVE':row['splines']=len(o.data.splines);row['bevel_depth']=o.data.bevel_depth;objects.append(row)
 if o.type!='MESH':continue
 me=o.data;me.calc_loop_triangles();row.update(faces=len(me.polygons),triangles=sum(len(p.vertices)==3 for p in me.polygons),ngons=sum(len(p.vertices)>4 for p in me.polygons),quads=sum(len(p.vertices)==4 for p in me.polygons))
 uv=me.uv_layers.active
 if uv and len(me.loop_triangles):
  vs=np.array([list(o.matrix_world@v.co) for v in me.vertices]);ix=np.array([t.vertices[:] for t in me.loop_triangles]);li=np.array([t.loops[:] for t in me.loop_triangles]);uvs=np.empty(len(uv.data)*2,dtype=np.float32);uv.data.foreach_get('uv',uvs);uvs=uvs.reshape(-1,2)[li];xyz=vs[ix];a=xyz[:,1]-xyz[:,0];b=xyz[:,2]-xyz[:,0];L=np.linalg.norm(a,axis=1);x=np.sum(a*b,axis=1)/np.maximum(L,1e-12);y=np.sqrt(np.maximum(0,np.sum(b*b,axis=1)-x*x));valid=(L>1e-9)&(y>1e-9)
  U=np.stack([uvs[:,1]-uvs[:,0],uvs[:,2]-uvs[:,0]],axis=2);J=U[valid].copy();J[:,:,0]/=L[valid,None];J[:,:,1]=(U[valid,:,1]-J[:,:,0]*x[valid,None])/y[valid,None];sv=np.linalg.svd(J,compute_uv=False);nonzero=sv[:,1]>1e-9;dist=(sv[nonzero,0]/sv[nonzero,1]-1)*100
  row.update(uv_layer=uv.name,uv_max_percent=float(dist.max()) if len(dist) else None,uv_over_10=int((dist>10.0001).sum()),uv_degenerate=int((~valid).sum()+(~nonzero).sum()),uv_metric='(sigma_max/sigma_min - 1)*100, rotation and scale independent, triangle Jacobian')
 else:row['uv_missing']=True
 used=set(p.material_index for p in me.polygons);row['materials']=[]
 for i in used:
  if i>=len(o.material_slots):continue
  m=o.material_slots[i].material
  if not m:continue
  row['materials'].append(m.name)
  if m.name in materials:continue
  bs=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if m.use_nodes else None
  materials[m.name]={'channels':{k:upstream(bs.inputs[k]) for k in ['Base Color','Normal','Roughness']} if bs else {},'roughness_default':bs.inputs['Roughness'].default_value if bs else None}
 objects.append(row)
for row in objects:
 if row['type']!='CURVE':continue
 o=bpy.data.objects[row['name']]
 for sl in o.material_slots:
  m=sl.material
  if not m or m.name in materials:continue
  bs=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if m.use_nodes else None
  materials[m.name]={'channels':{k:upstream(bs.inputs[k]) for k in ['Base Color','Normal','Roughness']} if bs else {},'roughness_default':bs.inputs['Roughness'].default_value if bs else None}
result={'objects':objects,'materials':materials,'summary':{'mesh_objects':sum(o['type']=='MESH' for o in objects),'triangles':sum(o.get('triangles',0) for o in objects),'quads':sum(o.get('quads',0) for o in objects),'ngons':sum(o.get('ngons',0) for o in objects),'bad_uv_objects':sum(o.get('uv_over_10',0)>0 or o.get('uv_degenerate',0)>0 or o.get('uv_missing',False) for o in objects),'bad_materials':[k for k,m in materials.items() if len(m['channels'])!=3 or not all(m['channels'].values())]}}
(O/'final-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('FINAL_AUDIT',result['summary'],flush=True)
