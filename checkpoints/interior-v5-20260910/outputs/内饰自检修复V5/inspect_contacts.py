exec(compile(open(__file__.replace('inspect_contacts.py','contact_check.py')).read().split('pairs=')[0],'<helper>','exec'))
o=bpy.data.objects['Car_INT'];ids=set()
for side in ['L','R']:
 for j in [1,2,3]:ids.update(b for a,b in tree(f'Vent_center_{side}_blade_{j}').overlap(tree('Car_INT')))
rows=[]
for i in sorted(ids):
 p=o.data.polygons[i];v=[o.matrix_world@o.data.vertices[j].co for j in p.vertices];rows.append({'id':i,'material':o.material_slots[p.material_index].material.name,'center':list(o.matrix_world@p.center),'normal':list(p.normal),'bounds':[[min(c[k] for c in v) for k in range(3)],[max(c[k] for c in v) for k in range(3)]]})
(O/'vent-contact-faces.json').write_text(json.dumps(rows,indent=2));print('FACES',len(rows));print(rows[:10])
