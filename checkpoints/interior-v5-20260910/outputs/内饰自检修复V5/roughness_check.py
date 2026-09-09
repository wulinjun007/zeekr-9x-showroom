import bpy,numpy as np,json
from pathlib import Path
O=Path(__file__).parent;rows=[]
for key in ['V4_fabric_Carbody','V4_leather_Door_RF_WG','V4_soft_Car_INT','CabinV3_SatinAluminium','Piano_Black','V4_screen_center']:
 m=bpy.data.materials.get(key)
 if not m:continue
 bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');sock=bs.inputs['Roughness'];node=sock.links[0].from_node if sock.is_linked else None
 if node and node.type=='TEX_IMAGE':
  im=node.image;a=np.empty(len(im.pixels),dtype=np.float32);im.pixels.foreach_get(a);v=a.reshape(-1,4)[:,0];row={'material':key,'min':float(v.min()),'median':float(np.median(v)),'max':float(v.max()),'image':im.name}
 else:row={'material':key,'roughness':float(sock.default_value),'connected':sock.is_linked}
 rows.append(row)
(O/'roughness-check.json').write_text(json.dumps(rows,indent=2));print(rows)
