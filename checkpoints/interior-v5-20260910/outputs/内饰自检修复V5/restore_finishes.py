import bpy,json,hashlib
from pathlib import Path
O=Path(__file__).parent;s=bpy.context.scene
names=['car_paint_hei','Plastic','Piano_Black','Rubber','Black_1','Glass_Clear','Glass_Clear_B','Glass_ROOF','Glass_ROOF_B','Glass_triangle','Glass_triangle_B','Glass_Light','Chrome_black','Chrome Matte','Chrome Glossy']
source=O.parent/'内饰最终图_4K/ZEEKR_9X_内饰4K_最终合成.blend';previous={n:bpy.data.materials.get(n) for n in names}
with bpy.data.libraries.load(str(source),link=False) as (a,b):
 chosen=[n for n in names if n in a.materials];b.materials=chosen.copy()
for name,new in zip(chosen,b.materials):
 old=previous[name]
 if old:old.name='V5_replaced_'+name;old.user_remap(new)
 new.name=name
# Explicit intended piano-black finish, as requested in the material specification.
m=bpy.data.materials.get('Piano_Black')
if m:
 bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 for key,value in [('Roughness',.08),('Coat Weight',1.),('Coat Roughness',.03)]:
  for l in list(bs.inputs[key].links):m.node_tree.links.remove(l)
  bs.inputs[key].default_value=value
helpers=(O.parent/'内饰展示精修V4/full_audit.py').read_text().split('for o in bpy.context.scene.objects:')[0];exec(compile(helpers.replace('O=Path(__file__).parent; rows=[];mats={}','# preserve output'),'<helper>','exec'))
def interior(o):return o.type in ('MESH','CURVE') and not o.hide_render and not any(c.hide_render for c in o.users_collection)
code=(O/'repair.py').read_text();r={'materials':[]};tex=O/'textures';exec(compile(code[code.index('def constant('):code.index('# Remove just')],'<maps>','exec'))
(O/'finish-restoration.json').write_text(json.dumps({'restored':chosen,'piano_roughness':.08,'piano_coat':1,'piano_coat_roughness':.03,'note':'Undo unintended shared-slot calibration of non-upholstery materials; preserve intended upholstery edits.'},ensure_ascii=False,indent=2));bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(O/'ZEEKR_9X_内饰自检修复V5.blend'));print('FINISHES_RESTORED',chosen)
