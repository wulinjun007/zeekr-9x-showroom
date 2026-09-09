import bpy,json,math,numpy as np
from pathlib import Path
O=Path(__file__).parent; rows=[];mats={}
def interior(o):
 if o.hide_render or any(c.hide_render for c in o.users_collection):return False
 return o.type in ['MESH','CURVE'] and (o.name.startswith(('Car_INT','Carbody_INT','CabinV2_Seat','CabinV3_','Seat_Layout','Seat_','Backrest_','CMF_Floor')) or ('Door' in o.name and any(s.material and any(x in s.material.name for x in ['CabinV','V4_']) for s in o.material_slots)))
def upstream(sock,seen=None):
 seen=set() if seen is None else seen;out=[]
 for l in sock.links:
  n=l.from_node
  if n in seen:continue
  seen.add(n)
  if n.type=='TEX_IMAGE' and n.image:out.append((n.image.name,list(n.image.size)))
  for i in n.inputs:out+=upstream(i,seen)
 return out
for o in bpy.context.scene.objects:
 if not interior(o):continue
 if o.type=='CURVE':rows.append({'name':o.name,'type':'CURVE','splines':len(o.data.splines)});continue
 used=set(p.material_index for p in o.data.polygons);sm=[]
 for i in used:
  m=o.material_slots[i].material
  if not m:continue
  sm.append(m.name)
  if m.name not in mats:
   bs=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if m.use_nodes else None
   mats[m.name]={'channels':{k:upstream(bs.inputs[k]) for k in ['Base Color','Normal','Roughness']} if bs else {},'roughness':bs.inputs['Roughness'].default_value if bs else None,'procedural_roughness':bool(bs and bs.inputs['Roughness'].is_linked)}
 uv=o.data.uv_layers.active;me=o.data;me.calc_loop_triangles();stretch=[];deg=0
 for t in me.loop_triangles:
  if not uv:continue
  v=[o.matrix_world@me.vertices[i].co for i in t.vertices];a=v[1]-v[0];b=v[2]-v[0];length=a.length
  if length<1e-10:deg+=1;continue
  x=b.dot(a)/length;y=max(0,b.length_squared-x*x)**.5
  if y<1e-10:deg+=1;continue
  tex=[uv.data[i].uv for i in t.loops];U=np.array([[tex[1].x-tex[0].x,tex[2].x-tex[0].x],[tex[1].y-tex[0].y,tex[2].y-tex[0].y]])
  J=U@np.linalg.inv(np.array([[length,x],[0,y]]));sv=np.linalg.svd(J,compute_uv=False)
  if sv[-1]<1e-10:deg+=1;continue
  stretch.append(float((sv[0]/sv[1]-1)*100))
 rows.append({'name':o.name,'type':'MESH','vertices':len(me.vertices),'faces':len(me.polygons),'tris':sum(len(p.vertices)==3 for p in me.polygons),'quads':sum(len(p.vertices)==4 for p in me.polygons),'ngons':sum(len(p.vertices)>4 for p in me.polygons),'uv_names':[u.name for u in me.uv_layers],'active_uv':uv.name if uv else None,'uv_distortion_max_pct':max(stretch) if stretch else None,'uv_bad_triangles':sum(v>10.00001 for v in stretch),'uv_degenerate':deg,'materials':sm,'modifiers':[(m.name,m.type) for m in o.modifiers]})
(O/'full-audit.json').write_text(json.dumps({'objects':rows,'materials':mats},ensure_ascii=False,indent=2));print('AUDIT',len(rows),len(mats));print('COUNTS',sum(r.get('tris',0) for r in rows),sum(r.get('quads',0) for r in rows),sum(r.get('ngons',0) for r in rows))
