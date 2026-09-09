import bpy,sys,json,time
from pathlib import Path
from mathutils import Vector
O=Path(__file__).parent;s=bpy.context.scene;tag=sys.argv[-1];p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='METAL';p.metalrt='ON';p.refresh_devices()
for d in p.devices:d.use=d.type=='METAL'
s.cycles.device='GPU';s.cycles.samples=64;s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_threshold=.035;s.cycles.use_denoising=True;s.render.resolution_x=1600;s.render.resolution_y=1000;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_depth='8'
# Shared neutral comparison compositor (no sharpening or secondary file outputs).
t=bpy.data.node_groups.new('V4_Review_Beauty','CompositorNodeTree');s.compositing_node_group=t;t.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor');rl=t.nodes.new('CompositorNodeRLayers');out=t.nodes.new('NodeGroupOutput');t.links.new(rl.outputs['Image'],out.inputs['Image'])
views=[('01_驾驶舱',(-.65,-.1,1.44),(.15,.7,1.10),35),('02_后排顶棚',(0,-1.67,1.47),(0,.50,1.38),22),('03_出风口近景',(.02,.22,1.23),(0,.735,1.025),55)]
if tag=='rearfix':views=views[1:2];tag='final'
for label,pos,target,lens in views:
 c=s.camera;c.location=pos;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.data.lens=lens;s.render.filepath=str(O/(tag+'_'+label+'.png'));bpy.ops.render.render(write_still=True);print('VIEW_COMPLETE',tag,label,flush=True)
