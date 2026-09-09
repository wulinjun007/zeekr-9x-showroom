# Production deployment · 2026-09-10

- Public website: https://zeekr-9x-showroom.vercel.app
- GitHub: https://github.com/wulinjun007/zeekr-9x-showroom (private source repository)
- Vercel project: https://vercel.com/007-0728/zeekr-9x-showroom
- Team: 007 / 007-0728
- Production branch: main
- Initial deployed application commit: d71b40a
- Initial deployment: dpl_4gh6BU6U9CwG9uNd2ceeUxgxv9Kj / READY / production
- Build: npm ci → npm run build:vercel → dist-vercel (Vite static client)
- Node: 24.x

## Live checks

Unauthenticated HTTP request to the production alias returned 200 and the correct ZEEKR HTML. All 15 model/material files returned HTTP 200; their SHA-256 values matched the local assets. Total checked bytes: 39,511,483. This is the combined asset inventory, not the initial transfer size.

The main zeekr-9x.glb is 7,884,724 bytes and is served as model/gltf-binary. The alternative seat GLB and all material maps are present. Detailed results are stored in production-asset-verification.json.

Opened the production alias in the in-app browser and observed the rendered vehicle and interior. Tested exterior paint, opening doors, entering the cabin, cognac upholstery and leather selection. Browser error log was empty in the tested session.

## Repository integration

Vercel project metadata confirms GitHub link wulinjun007/zeekr-9x-showroom, repository ID 1362879556, productionBranch main. Future pushes to main use the existing Vercel Git integration. This record is pushed separately to exercise that integration after the first CLI deployment.

Local .vercel and .env.local are excluded from Git; .env files are excluded from deployment. Native Blender project archives remain private GitHub Release assets and are not placed in public website assets.

## Validation limits

This is a static website deployment. No server-side application function logs apply. Browser checks and asset integrity do not prove performance on every device or network. The existing build warns about a large JS chunk; hardware-adaptive rendering remains enabled. No additional monitoring service or log drain was configured during this release.
