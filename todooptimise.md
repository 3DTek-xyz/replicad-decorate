# TODO: Optimizations for parseSVG.js

## Performance Improvements
- ✅ Remove redundant `Array.from()` calls - use `for...of` directly on NodeLists
- ✅ Cache parsed transform matrices for repeated transforms
- ✅ Reduce blueprint array operations - use consistent `.push()` instead of mix of `.push()` and `.concat()`

## Other
- Extract common transform-apply logic to reduce duplication (circle/ellipse, path/polygon patterns)
- ✅ Fix variable shadowing - `width` parameter vs `width` variable in rect loop (renamed to rectWidth/rectHeight)
- Add null checks for `getAttribute()` before `parseFloat()`

## Advanced Transform Features (Future)
- Implement proper arc transformation (currently only endpoint transformed)
- Convert ellipse to cubic bezier curves for accurate scale/rotation
- Support relative path commands in arc transformations
- Handle nested/group transforms (transform inheritance)

## Testing Needed
- Test with complex SVG files containing multiple transform types
- Verify polygon transform handling
- Test edge cases: empty attributes, malformed transforms, missing coordinates
