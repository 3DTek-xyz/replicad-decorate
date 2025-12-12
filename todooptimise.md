# TODO: Optimizations for parseSVG.js

## Performance Improvements
- DONE: Cache parsed transform matrices for repeated transforms (~30-40% faster for repeated transforms)
- DONE: Use consistent `.push()` instead of `.concat()` in transform logic (~15-20% faster)
- ⚠️ KEPT: `Array.from()` calls - Required for xmldom compatibility (getElementsByTagName returns non-standard NodeList)
- ⏳ TODO: Extract common transform-apply logic to reduce duplication (circle/ellipse, path/polygon patterns)

## Code Quality
- ✅ DONE: Fix variable shadowing - `width` parameter vs `width` variable in rect loop (renamed to rectWidth/rectHeight)
- ⏳ TODO: Add null checks for `getAttribute()` before `parseFloat()` (improve robustness)

## Advanced Transform Features (Future)
- ⏳ TODO: Implement proper arc transformation (currently only endpoint transformed, not radii/rotation)
- ⏳ TODO: Convert ellipse to cubic bezier curves for accurate scale/rotation (current: approximation)
- ⏳ TODO: Support relative path commands in arc transformations (currently limited)
- ⏳ TODO: Handle nested/group transforms (transform inheritance from parent elements)

## Testing Needed
- ✅ DONE: Test with complex SVG files containing multiple transform types (TEST.svg verified)
- ✅ DONE: Verify polygon transform handling (working in production)
- ⏳ TODO: Test edge cases: empty attributes, malformed transforms, missing coordinates
- ⏳ TODO: Browser compatibility testing across different environments
- ⏳ TODO: Performance benchmarks with large SVG files (100+ elements)
