"""Read-only source GLB / robot surface intersection check in Blender.

First run robot-contact-export.mjs through checks/ts-resolver.mjs.
Tests the sampled unanimated assembly. Does not certify ergonomics, enclosed
volumes, every continuous slider value, seat variants, or dynamic road poses.
"""
import json
from pathlib import Path
from mathutils.bvhtree import BVHTree
from mathutils import Vector

payload = json.loads(Path('outputs/robot-contact-geometry.json').read_text())
vertices, faces, owners = [], [], []
for mesh in payload['cars']:
    offset = len(vertices)
    vertices.extend(Vector(vertex) for vertex in mesh['vertices'])
    faces.extend(tuple(index + offset for index in face) for face in mesh['faces'])
    owners.extend([mesh['name']] * len(mesh['faces']))
car = BVHTree.FromPolygons(vertices, faces, all_triangles=True, epsilon=0)
results = []
for pose in payload['poses']:
    hits = []
    for mesh in pose['robots']:
        robot = BVHTree.FromPolygons(
            [Vector(vertex) for vertex in mesh['vertices']],
            mesh['faces'], all_triangles=True, epsilon=0,
        )
        pairs = robot.overlap(car)
        if pairs:
            hits.append({
                'robot': mesh['name'], 'pairs': len(pairs),
                'car': sorted(set(owners[pair[1]] for pair in pairs)),
            })
    results.append({
        'height': pose['height'], 'offset': pose['offset'], 'collisions': hits,
    })
Path('outputs/robot-contact-report.json').write_text(
    json.dumps(results, ensure_ascii=False, indent=2),
)
print('CONTACT_CHECK', json.dumps(results, ensure_ascii=False))
assert not any(result['collisions'] for result in results), 'Robot/car surface intersections found'
