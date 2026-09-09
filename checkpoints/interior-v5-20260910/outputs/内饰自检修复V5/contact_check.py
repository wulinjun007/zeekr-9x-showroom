import bpy,json
from mathutils.bvhtree import BVHTree
from pathlib import Path
O=Path(__file__).parent;s=bpy.context.scene;dg=bpy.context.evaluated_depsgraph_get();cache={}
def tree(name):
 if name not in cache:
  o=bpy.data.objects[name];cache[name]=BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],[p.vertices[:] for p in o.data.polygons],all_triangles=False,epsilon=0)
 return cache[name]
pairs=[('CabinV2_Seat_19','Door_LF_WG'),('CabinV2_Seat_24','Door_RF_WG'),('CabinV2_Seat_00','Door_LB_INT_6S'),('CabinV2_Seat_01','Door_RB_INT_6S')]+[(f'Vent_center_{side}_blade_{j}','Car_INT') for side in ['L','R'] for j in [1,2,3]]
rows=[]
for a,b in pairs:
 collisions=tree(a).overlap(tree(b));rows.append({'a':a,'b':b,'surface_triangle_pair_intersections':len(collisions),'meaning':'candidate surface intersections; no whole-scene clearance certification'});print('CONTACT',a,b,len(collisions),flush=True)
(O/'contact-check.json').write_text(json.dumps({'pairs':rows,'limitations':['Only listed pairs checked. Shared intended assembly contacts are not automatically abnormal.','Whole-scene self intersections and gaps are not fully verified.']},ensure_ascii=False,indent=2))
