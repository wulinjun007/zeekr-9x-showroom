"""Independently authored N90 Max reference study; not OEM engineering geometry.
Blender 5.x: blender -b --python scripts/blender/build_n90.py -- <output-dir>
Dimensions are a reference envelope; surface matching remains subject to review.
"""
import bpy, math, os, sys, json
from mathutils import Vector
from math import sin,cos,pi,sqrt
OUT=os.path.abspath(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else os.path.abspath('outputs/n90')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
root=bpy.data.objects.new('N90_Max_Reference_Study',None);scene.collection.objects.link(root)
root['status']='Independent reference model; multi-view fidelity not yet accepted'
root['reference']='https://www.xiaomiev.com/configurator/select?goodsId=900020450&itemId=500042050&ssuId=600147082&type=2d'
def material(name,color,metal=0,rough=.5,coat=0,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 m.node_tree.nodes.clear();p=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled');p.name='Principled BSDF';out=m.node_tree.nodes.new('ShaderNodeOutputMaterial');m.node_tree.links.new(p.outputs['BSDF'],out.inputs['Surface']);p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Coat Weight'].default_value=coat;p.inputs['Coat Roughness'].default_value=.18
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
paint=material('N90_Paint',(.095,.23,.26),.60,.34,.4)
black=material('N90_Trim',(.012,.018,.022),.15,.34)
rubber=material('N90_Tire',(.018,.019,.021),0,.88)
chrome=material('N90_Aluminum',(.58,.64,.67),.95,.24)
wheel=material('N90_WheelFace',(.49,.55,.59),.96,.22)
glass=material('N90_Glass',(.028,.054,.064),.08,.12,.6)
p=glass.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.6;p.inputs['IOR'].default_value=1.45
leather=material('N90_Leather',(.32,.18,.095),0,.74)
seam=material('N90_Stitch',(.49,.34,.22),0,.9)
wood=material('N90_Wood',(.10,.067,.045),0,.7)
fabric=material('N90_Headliner',(.23,.14,.088),0,.94)
light=material('N90_DRL',(.85,.96,1),.1,.25,emission=2)
red=material('N90_Taillight',(1,.025,.018),.1,.24,emission=1.5)
ambient=material('N90_Ambient',(1,.49,.15),0,.5,emission=2)
screen=material('N90_Screen',(.02,.06,.09),.1,.3,emission=.25)
# Fine leather grain remains editable in the Blend; GLB uses the separately authored micro-normal.
for mat,scale,strength in [(leather,360,.10),(fabric,480,.14),(wood,80,.05)]:
 nodes=mat.node_tree.nodes;links=mat.node_tree.links;p=nodes.get('Principled BSDF')
 tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=scale;tex.inputs['Detail'].default_value=2
 bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=strength;bump.inputs['Distance'].default_value=.0012;links.new(tex.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],p.inputs['Normal'])
def group(name,loc=(0,0,0)):
 o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=root;o.location=loc;return o
body=group('Body');cabin=group('Cabin');roof=group('RoofLift');chassis=group('Chassis')
def finish(o,name,mat,parent,bevel=0):
 o.name=name;o.data.materials.append(mat)
 if bevel:
  mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=bevel;mod.segments=5
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 for f in o.data.polygons:f.use_smooth=True
 if bevel:
  normal=o.modifiers.new('Stable manufactured normals','WEIGHTED_NORMAL');normal.keep_sharp=True;normal.weight=40
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=normal.name)
 o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
 return o

def cube(name,loc,scale,mat,parent=body,bevel=.015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,mat,parent,bevel)
def mesh(name,verts,faces,mat,parent=body,solid=0):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);finish(o,name,mat,parent)
 if solid:
  mod=o.modifiers.new('Panel thickness','SOLIDIFY');mod.thickness=solid
 return o

def path(name,pts,r,mat,parent=body,closed=False):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=2;curve.bevel_depth=r;curve.bevel_resolution=2
 poly=curve.splines.new('POLY');poly.points.add(len(pts)-1)
 for p,v in zip(poly.points,pts):p.co=(*v,1)
 poly.use_cyclic_u=closed;o=bpy.data.objects.new(name,curve);scene.collection.objects.link(o);o.data.materials.append(mat);o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted();return o

def cyl(name,loc,r,depth,mat,parent=body,axis='Z',vertices=64):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc);o=bpy.context.object
 if axis=='X':o.rotation_euler.y=pi/2
 if axis=='Y':o.rotation_euler.x=pi/2
 return finish(o,name,mat,parent,.002)
def torus(name,loc,major,minor,mat,parent=body,axis='Z'):
 bpy.ops.mesh.primitive_torus_add(major_segments=96,minor_segments=16,location=loc,major_radius=major,minor_radius=minor);o=bpy.context.object
 if axis=='X':o.rotation_euler.y=pi/2
 if axis=='Y':o.rotation_euler.x=pi/2
 return finish(o,name,mat,parent)
def label(name,txt,loc,size,mat,parent=body,rotation=(pi/2,0,0)):
 d=bpy.data.curves.new(name,'FONT');d.body=txt;d.align_x='CENTER';d.size=size;d.extrude=.0005;d.space_character=1.25
 o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=rotation;o.data.materials.append(mat);o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted();return o
# Wheels have independent roots and replaceable machined face geometry.
for side in [-1,1]:
 for y in [-1.54,1.54]:
  tag=('L' if side>0 else 'R')+('F' if y<0 else 'B');g=group('Wheel_'+tag,(side*.91,y,.425));bpy.context.view_layer.update()
  x=side*.925
  torus('Tire_'+tag,(x,y,.425),.326,.098,rubber,g,'X')
  for dx in [-.07,.07]:torus('Sidewall_'+tag,(x+dx,y,.425),.326,.04,rubber,g,'X')
  cyl('Brake_'+tag,(side*.963,y,.425),.24,.025,black,g,'X')
  cyl('RimBarrel_'+tag,(side*.99,y,.425),.271,.025,black,g,'X')
  torus('RimLip_'+tag,(side*1.014,y,.425),.263,.009,chrome,g,'X')
  for i in range(10):
   a=i*pi/5
   pts=[(side*1.022,y+cos(a)*.068,.425+sin(a)*.068),(side*1.025,y+cos(a-.09)*.15,.425+sin(a-.09)*.15),(side*1.02,y+cos(a-.20)*.252,.425+sin(a-.20)*.252)]
   path('RimSpoke_'+tag,pts,.012,wheel,g)
   path('RimSplit_'+tag,[pts[1],(side*1.02,y+cos(a+.13)*.252,.425+sin(a+.13)*.252)],.009,wheel,g)
  cyl('WheelCap_'+tag,(side*1.033,y,.425),.06,.014,chrome,g,'X')
  for i in range(5):
   a=i*2*pi/5;cyl('Lug_'+tag,(side*1.043,y+cos(a)*.043,.425+sin(a)*.043),.007,.008,black,g,'X',16)
  for i in range(64):
   a=i*2*pi/64
   pts=[(x-.068,y+cos(a-.022)*.423,.425+sin(a-.022)*.423),(x,y+cos(a)*.425,.425+sin(a)*.425),(x+.068,y+cos(a+.022)*.423,.425+sin(a+.022)*.423)]
   path('Tread_'+tag,pts,.0018,black,g)
# Exterior lower shell: longitudinal body strips follow actual wheel apertures.
def low(y):
 z=.32
 for yc in [-1.54,1.54]:
  dy=y-yc
  if abs(dy)<.458:z=max(z,.425+sqrt(.458**2-dy**2))
 return z

def sidepanel(name,side,ya,yb,parent):
 verts=[];ny=max(16,int((yb-ya)*70));nz=12
 for i in range(ny+1):
  y=ya+(yb-ya)*i/ny;bottom=low(y)
  for j in range(nz+1):
   t=j/nz;z=bottom+(1.24-bottom)*t
   nose=max(0,abs(y)-2.35)*.24
   x=side*(.994-nose-.034*(1-t)**2+.009*sin(t*pi))
   verts.append((x,y,z))
 faces=[]
 for i in range(ny):
  for j in range(nz):
   a=i*(nz+1)+j;f=(a,a+nz+1,a+nz+2,a+1);faces.append(f if side>0 else f[::-1])
 return mesh(name,verts,faces,paint,parent,.014)
for side in [-1,1]:
 prefix='L' if side>0 else 'R'
 front=group('Door_'+prefix+'F',(side*.975,-.98,1.1));rear=group('Door_'+prefix+'B',(side*.975,.26,1.1));bpy.context.view_layer.update()
 for name,a,b,parent in [('FenderFront',-2.53,-.991,body),('FrontDoor',-.982,.239,front),('RearDoor',.25,1.34,rear),('Quarter',1.351,2.52,body)]:sidepanel(prefix+'_'+name,side,a,b,parent)
 for yc in [-1.54,1.54]:
  pts=[(side*1.006,yc+cos(pi*i/64)*.47,.425+sin(pi*i/64)*.47) for i in range(65)]
  path('FenderLip',pts,.018,paint)
 cube('Rocker_'+prefix,(side*.94,0,.30),(.09,2.2,.115),black,body,.025)
 path('SillChrome_'+prefix,[(side*.989,-.98,.36),(side*.999,1.06,.36)],.009,chrome)
 for name,ya,yb,parent in [('WindowFront',-.93,.20,front),('WindowRear',.29,1.31,rear),('WindowQuarter',1.40,2.13,body)]:
  ymin=ya+.33 if ya<0 else ya+.025
  verts=[(side*.965,ya,1.28),(side*.965,yb,1.28),(side*.855,yb-.07,1.79),(side*.835,ymin,1.79)]
  mesh(prefix+'_'+name,verts,[(0,1,2,3)],glass,parent,.006)
  path('WindowGasket',verts,.011,black,parent,True)
 for y,parent in [(.04,front),(1.11,rear)]:
  cube('DoorHandle',(side*1.014,y,1.165),(.025,.145,.04),black,parent,.013)
  cube('HandleBright',(side*1.029,y,1.175),(.012,.12,.012),chrome,parent,.004)
 # Large warm door panels, separate from glass; their geometry follows the opening door.
 for ya,yb,parent in [(-.94,.21,front),(.29,1.30,rear)]:
  yc=(ya+yb)/2
  cube('DoorLeather',(side*.915,yc,.94),(.07,yb-ya,.52),leather,parent,.045)
  cube('DoorArmrest',(side*.853,yc,.88),(.17,(yb-ya)*.77,.10),leather,parent,.032)
  path('DoorAmbient',[(side*.87,ya+.08,.97),(side*.87,yb-.08,.97)],.004,ambient,parent)
  cube('DoorMetalHandle',(side*.866,ya+.19,1.04),(.018,.15,.07),chrome,parent,.016)
  cube('HandleInset',(side*.85,ya+.19,1.04),(.012,.11,.045),black,parent,.009)
  cyl('DoorSpeaker',(side*.866,yb-.16,.72),.072,.01,black,parent,'X')
 # B/C pillars, chrome outline and roof-edge structure.
 for y in [.245,1.355]:
  path('Pillar',[(side*.97,y,1.24),(side*.85,y-.01,1.81)],.033,black)
 path('WindowBright',[(side*.965,-1.00,1.25),(side*.82,-.56,1.78),(side*.82,-.40,1.83),(side*.85,1.96,1.83),(side*.97,2.24,1.27),(side*.965,-1.,1.25)],.006,chrome)
 path('RoofRail',[(side*.70,-.51,1.878),(side*.70,1.92,1.878)],.027,black,roof)
 # Frameless mirrors.
 path('MirrorStem',[(side*.97,-.79,1.25),(side*1.1,-.79,1.32)],.026,black,front)
 cube('MirrorShell',(side*1.135,-.78,1.34),(.18,.24,.13),paint,front,.055)
 cube('MirrorGlass',(side*1.135,-.652,1.34),(.15,.009,.09),chrome,front,.025)
# Curved hood as a dense loft, independent bonnet group.
hood=group('Hood',(0,-1.03,1.23));bpy.context.view_layer.update()
verts=[];nx=32;ny=24
for j in range(ny+1):
 y=-2.52+1.5*j/ny
 for i in range(nx+1):
  x=-.935+1.87*i/nx;z=1.245+.053*(1-(x/.98)**2)+.008*j/ny;verts.append((x,y,z))
mesh('HoodSkin',verts,[(j*(nx+1)+i,j*(nx+1)+i+1,(j+1)*(nx+1)+i+1,(j+1)*(nx+1)+i) for j in range(ny) for i in range(nx)],paint,hood,.015)
# Front face and the distinctive horizontal crossed lamps.
cube('Nose',(0,-2.54,1.12),(1.89,.12,.24),paint,body,.055)
cube('Bumper',(0,-2.54,.69),(1.93,.14,.67),paint,body,.07)
cube('LowerGrille',(0,-2.621,.58),(1.35,.018,.26),black,body,.045)
for z in [.48,.53,.58,.63,.68]:cube('GrilleSlat',(0,-2.637,z),(1.25,.015,.011),black,body,.003)
for side in [-1,1]:
 cube('LampHousing',(side*.693,-2.612,1.15),(.45,.05,.20),black,body,.03)
 for z in [1.114,1.19]:
  cube('DRL',(side*.67,-2.644,z),(.36,.008,.011),light,body,.004)
  for dx in [.095,.13]:
   o=cube('LampCross',(side*(.70+dx),-2.65,z+.004),(.010,.009,.045),light,body,.003);o.rotation_euler.y=.22
 cube('AirCurtain',(side*.80,-2.619,.70),(.12,.02,.31),black,body,.046)
label('FrontWordmark','S K Y N O M A D',(0,-2.61,1.139),.045,chrome)
plate=cube('FrontPlate',(0,-2.66,.78),(.39,.02,.14),chrome,body,.012);label('FrontPlateText','N90',(0,-2.673,.743),.082,black)
# Windshield, roof, hatch and continuous rear signature.
mesh('Windshield',[(-.925,-1.02,1.31),(.925,-1.02,1.31),(.795,-.48,1.81),(-.795,-.48,1.81)],[(0,1,2,3)],glass,body,.006)
for side in [-1,1]:path('A_Pillar',[(side*.94,-1.05,1.27),(side*.81,-.50,1.81)],.036,paint)
cube('RoofOuter',(0,.73,1.841),(1.66,2.47,.10),paint,roof,.12)
cube('PopTop',(0,.75,1.906),(1.44,2.24,.045),black,roof,.06)
cube('Lidar',(0,-.49,1.883),(.32,.17,.056),black,body,.04)
hatch=group('Tailgate',(0,2.03,1.79));bpy.context.view_layer.update()
mesh('RearGlass',[(-.89,2.47,1.24),(.89,2.47,1.24),(.80,2.06,1.78),(-.80,2.06,1.78)],[(0,1,2,3)],glass,hatch,.006)
cube('TailgateSkin',(0,2.49,.99),(1.86,.14,.51),paint,hatch,.048)
cube('RearLampBacking',(0,2.571,1.12),(1.75,.018,.15),black,hatch,.025)
for z in [1.065,1.177]:path('RearLight',[(x,2.583,z) for x in [-.86,-.4,0,.4,.86]],.006,red,hatch)
for x in [-.86,.86]:path('RearLightEnd',[(x,2.582,1.065),(x,2.582,1.177)],.008,red,hatch)
label('RearWordmark','S K Y N O M A D',(0,2.585,.97),.043,chrome,hatch,(pi/2,0,pi))
cube('RearBumper',(0,2.49,.47),(1.91,.24,.23),black,body,.065)
path('RearBright',[(-.82,2.63,.53),(0,2.64,.48),(.82,2.63,.53)],.014,chrome)
cube('RoofHeadliner',(0,.70,1.773),(1.53,2.28,.033),fabric,roof,.065)
# Cabin floor, rails and five-seat explorer study.
cube('CabinFloor',(0,.46,.43),(1.76,3.82,.045),wood,cabin,.025)
for x in [-.68,-.30,.30,.68]:
 cube('SeatRail',(x,.40,.46),(.018,2.70,.012),chrome,cabin,.004)
for i in range(18):path('FloorGrain',[(-.84+i*.10,-1.30,.459),(-.84+i*.10,2.28,.459)],.0009,black,cabin)
for row,y in [(0,-.35),(1,.96)]:
 xs=[-.49,.49] if row==0 else [-.55,0,.55]
 for ix,x in enumerate(xs):
  g=group('Seat_%s_%s'%(row,ix),(x,y,.52));bpy.context.view_layer.update()
  width=.48 if row else .53
  cube('SeatBase',(x,y,.57),(width,.59,.12),black,g,.055)
  cube('SeatCushion',(x,y-.04,.68),(width,.57,.16),leather,g,.075)
  back=cube('SeatBack',(x,y+.23,1.06),(width,.17,.68),leather,g,.075);back.rotation_euler.x=-.11
  cube('SeatInsert',(x,y+.124,1.06),(width*.64,.035,.49),leather,g,.055)
  cube('Headrest',(x,y+.29,1.52),(width*.69,.18,.25),leather,g,.075)
  for sx in [-1,1]:
   o=cube('SeatBolster',(x+sx*width*.40,y+.125,1.05),(.08,.09,.53),leather,g,.033);o.rotation_euler.y=sx*.08
  # Geometric diamond stitching is kept separate and editable, at millimetre scale.
  for k in range(-2,4):
   for direction in [-1,1]:
    pts=[]
    for j in range(51):
     zz=.82+j*.0095;xx=x+k*.09+direction*(zz-.82)*.45
     if abs(xx-x)<width*.28:pts.append((xx,y+.100,zz))
    if len(pts)>1:path('DiamondStitch',pts,.0008,seam,g)
  for sx in [-1,1]:
   path('SeatPiping',[(x+sx*width*.44,y-.25,.74),(x+sx*width*.44,y+.12,.74),(x+sx*width*.44,y+.14,1.29)],.0025,seam,g)
  path('Seatbelt',[(x-width*.47,y+.20,1.39),(x+width*.38,y-.08,.76),(x-width*.40,y-.10,.75)],.012,black,g)
  cube('BeltBuckle',(x+width*.46,y+.11,.71),(.032,.046,.052),black,g,.006)
# Instrument panel with a physical central display and machined vents.
cube('Dashboard',(0,-1.02,1.15),(1.78,.34,.19),leather,cabin,.07)
path('DashAmbient',[(-.80,-.81,1.14),(0,-.82,1.14),(.80,-.81,1.14)],.004,ambient,cabin)
cube('DashWood',(0,-.825,1.06),(1.66,.025,.085),wood,cabin,.012)
for x in [-.71,-.53,.53,.71]:
 cube('Vent',(x,-.798,1.09),(.13,.02,.03),black,cabin,.008)
 for i in range(5):cube('VentFin',(x-.048+i*.024,-.783,1.09),(.006,.007,.022),chrome,cabin,.001)
cube('DisplayFrame',(-.18,-.77,1.29),(.69,.045,.34),black,cabin,.022)
def display_panel(name,x,y,z,w,h):
 o=mesh(name,[(x-w/2,y,z-h/2),(x+w/2,y,z-h/2),(x+w/2,y,z+h/2),(x-w/2,y,z+h/2)],[(0,1,2,3)],screen,cabin)
 uv=o.data.uv_layers.new(name='DisplayUV')
 coords=[(1,0),(0,0),(0,1),(1,1)]
 for face in o.data.polygons:
  for li in face.loop_indices:uv.data[li].uv=coords[o.data.loops[li].vertex_index]
 return o
display_panel('CenterScreen',-.18,-.743,1.29,.655,.305)
display_panel('Instrument',.48,-.813,1.27,.39,.13)
steer=group('Steering');torus('SteeringRim',(.48,-.55,1.10),.168,.020,leather,steer,'Y')
cube('SteeringHub',(.48,-.55,1.10),(.18,.055,.095),leather,steer,.03)
for sx in [-1,1]:cube('SteeringSpoke',(.48+sx*.111,-.55,1.10),(.09,.02,.035),chrome,steer,.008)
label('SteeringMark','mi',(.48,-.515,1.085),.025,chrome,steer,(pi/2,0,pi))
island=group('SlidingIsland');cube('Island',(0,-.01,.73),(.30,.68,.43),leather,island,.045)
for y in [-.16,.06]:cyl('Cupholder',(0,y,.951),.065,.018,black,island)
for side in [-1,1]:path('CabinAmbient',[(side*.81,-.7,.54),(side*.81,1.8,.54)],.004,ambient,cabin)
table=group('Table');cube('TableTop',(0,.56,.96),(.60,.42,.025),wood,table,.018);cyl('TablePedestal',(0,.56,.73),.035,.43,chrome,table)
table.hide_render=True
# Chassis is an illustrative assembly, not crash/engineering evidence.
cube('BatteryIllustration',(0,.2,.28),(1.35,2.3,.09),black,chassis,.02)
for y in [-1.54,1.54]:cyl('AxleIllustration',(0,y,.39),.035,1.7,black,chassis,'X')
# Pack provenance, convert curve/text surfaces for portable glTF, then save editable Blend.
readme=bpy.data.texts.new('READ_ME');readme.write('N90 Max explorer independent reference study. No OEM mesh or commercial stock geometry copied. Proportions, interior and mechanisms need calibrated multi-view acceptance; no engineering simulation claims.\n'+root['reference'])
scene.world.color=(.2,.2,.2)
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=1440;scene.render.resolution_y=960;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
bpy.ops.object.camera_add(location=(7,-9,3.7));cam=bpy.context.object;cam.name='Reference_Hero';cam.rotation_euler=(Vector((0,0,.93))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=52;scene.camera=cam
for name,loc,power,size in [('Key',(1,-4,6),1400,5),('Fill',(-4,1,4),950,4),('Rim',(3,4,5),1700,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.9))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'N90_Max_校准中.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in list(scene.objects):
 if o.type in {'CURVE','FONT'}:
  o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');o.select_set(False)
for o in scene.objects:
 if o.type=='MESH':
  o.select_set(True);bpy.context.view_layer.objects.active=o
  for mod in list(o.modifiers):
   try:bpy.ops.object.modifier_apply(modifier=mod.name)
   except:pass
  o.select_set(False)
# Explicit render-only hidden table is still exported for the web's space interaction.
for o in scene.objects:o.hide_render=False
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type in {'MESH','EMPTY'}:o.select_set(True)
bpy.ops.export_scene.gltf(use_selection=True,filepath=os.path.join(OUT,'n90-max-study.glb'),export_format='GLB',export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
report={'objects':len(scene.objects),'meshes':len([o for o in scene.objects if o.type=='MESH']),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in scene.objects if o.type=='MESH'),'status':'reference-study-not-calibrated','source':root['reference']}
with open(os.path.join(OUT,'model-report.json'),'w') as f:json.dump(report,f,indent=2)
print('N90_EXPORT',json.dumps(report))
