import bpy
from pathlib import Path
O=Path(__file__).parent;o=bpy.data.objects['Vent_center_cavity'];uv=o.data.uv_layers.active
for p in o.data.polygons:
 vs=[o.matrix_world@o.data.vertices[i].co for i in p.vertices];u=(vs[1]-vs[0]).normalized();n=(vs[1]-vs[0]).cross(vs[2]-vs[0]).normalized();v=n.cross(u).normalized()
 for li,co in zip(p.loop_indices,vs):uv.data[li].uv=(co.dot(u)/.12,co.dot(v)/.12)
bpy.ops.wm.save_as_mainfile(filepath=str(O/'ZEEKR_9X_内饰自检修复V5.blend'))
