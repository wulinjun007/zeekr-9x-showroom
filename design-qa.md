# ZEEKR 9X immersive showroom — design QA

Date: 2026-09-10
Scope: apply the observed Xiaomi N90 Max showroom presentation to the existing ZEEKR experience, preserving the user's black/night entry and existing simulation/configuration features. This is an adaptation of the interface, not a replacement vehicle or a pixel-identical copy of Xiaomi's product assets.

## Visual sources and evidence

- Source visual truth: https://show.xiaomiev.com/v2/showroom?itemId=510036425189&ssuId=610036685987&source=pcn90homepage — CUA tab 4, exterior and interior screenshots opened in this run.
- Official model page: https://www.xiaomiev.com/skynomad/n90 — CUA tab 3, captured hero and inspected navigation/content. Observed title: 小米澎程N90 Max.
- Implementation URL: http://localhost:3001/?section=exterior&view=hero&mode=night — CUA tab 5, separate test tab.
- Implementation screenshot path: inline CUA screenshots in this task; no filesystem screenshot file was supplied by the capture API used here.
- Full-view comparison: paired source and implementation screenshots returned in the same CUA tool result, both 1280 × 720 pixels / CSS viewport, apparent 1× capture density. Source retained its default environment and green paint; implementation intentionally retains black/night per the user's earlier requirement.
- Interior comparison: paired 1280 × 720 screenshots, source first-row seat view and implementation passenger/dashboard view. These are different vehicle geometries and camera locations; comparisons cover interface placement, density and hierarchy, not identical surface detail.
- Mobile implementation: 390 × 844 pixels / CSS viewport. DOM measured body, main and canvas as exactly 390 × 844. The source mobile state was not captured; this is a responsive usability check, not a claim of mobile pixel matching.
- Focused comparison: inspected top navigation, bottom configuration controls, material labels and camera selector within the paired full-size captures, with individual mobile control and HMI state captures. Labels remain readable at capture resolution.

## Findings and iteration history

1. [P1, fixed] Original permanent 326px sidebar and separate header/footer reduced vehicle area and exposed too many controls at once. Replaced with a viewport-filling scene, overlaid text navigation, persistent compact swatches and an explicit collapsible detail panel. Existing control components remain in that panel.
2. [P2, fixed] First pass showed truncated `9X / E` beside the wordmark. Changed to a deliberate `9X` label. Revised desktop capture shows the complete label.
3. [P2, fixed] Initial wide-screen hero remained too small after expanding the viewport. Moved hero camera closer and lower, using the same shared position for the arrival/orbit join. Updated portrait FOV to preserve the full vehicle. Checked 1,440 orbit frames at five aspect ratios and actual 390 × 844 preview.
4. [P2, fixed] Camera selector overlapped the lower wheel region at 1280 × 720. Moved selector down 32px. Revised capture shows the car above the selector and selection dock.
5. [P2, fixed] Mobile wheel choices lost their visible names. Retained compact labels under icons; final phone capture shows all three named choices within the viewport. Added explicit accessible label for the icon-only mobile orbit control.
6. [P2, fixed] HMI panel overlapped the camera selector. Raised the instrument overlay (desktop bottom 210px, phone 260px). Final 1280 × 720 capture shows separate instrument, camera and configuration rows; startup playback reached READY.
7. [P2, fixed] Low-contrast selector captions in the expanded HMI panel and raw `readingLights` hotspot label. Set a darker caption colour and reused the existing localized lab label fallback.

## Required fidelity surfaces

- Typography: restrained sans-serif labels, compact 11–13px navigation and small selected-option captions. Retains existing system-font stack and ZEEKR wordmark, rather than copying Xiaomi's logo/font asset. Clear active underline. No clipped labels in checked views.
- Spacing/layout: single full-frame canvas, top navigation and bottom grouping follow the source hierarchy. Added camera presets, advanced controls, quality control and source note are intentional carryovers from the existing product. Detail drawer does not resize/remount the canvas.
- Colours/tokens: white and muted grey interface over a dark gradient; restrained rectangular controls. Source's outdoor/grey scene is intentionally adapted to the requested black/night default. Night floor reflection reduced and guide ring hidden in night mode.
- Image quality/assets: live existing ZEEKR model retained. No Xiaomi vehicle geometry, images, logos or videos downloaded or substituted. Existing material and geometry limitations remain visible; this UI pass does not assert OEM-quality interior fidelity. Library icons signify choices; visible labels distinguish wheel variants.
- Copy/content: functional exterior, interior, structure, driving and tour navigation; new UI labels cover zh/en/de/ja/ar. Pricing/orders were not introduced; existing concept/source explanations are preserved.

## Interaction and runtime verification

- Exterior paint selection changed selected state and vehicle appearance.
- Wheel selection changed wheel geometry and smoothly moved to the wheel detail view.
- Interior navigation, cognac theme and leather/fabric selection updated the same scene.
- Expanded/closed desktop and phone controls; existing CMF/environment/seating controls remain available. Escape closes the panel.
- Driving section opens existing HMI controls; startup playback completed to READY with instrument and timeline updates.
- Entrance/automatic tour observed; skip/end guide remains operable.
- Browser error log on test tab: empty after the tested selections and HMI playback.
- TypeScript check and Vercel production build passed. Existing large JS chunk warning remains (about 320KB gzip entry); no blanket 60fps or all-device guarantee is claimed.
- Existing automated checks passed: configuration round trip, adaptive quality/session, render pixel budgets/static batching, entrance, showcase, animation-clock recovery and 25 scenario states.
- No new render loop, duplicate canvas, model download or heavy visual asset was added. Full-screen area still uses the existing adaptive pixel budget.

## Follow-up polish / scope limits

- The retained model has coarser interior geometry than the Xiaomi reference. A separate model refinement pass is needed to match that asset quality.
- Real low-end devices and touch hardware have not been benchmarked; responsive viewport and rendering-budget checks are limited evidence.
- Vercel production publication completed on 2026-09-10 after this local design QA. See docs/DEPLOYMENT-2026-09-10.md for the live URL and asset checks.

final result: passed
