// Rollup plugin to add WordPress worker-compatible header
export default function wordpressHeader() {
  return {
    name: 'wordpress-header',
    renderChunk(code) {
      const header = `// replicad destructuring removed - will be injected by worker
// This is now handled in worker.js which injects all replicad exports into global scope

// Declare globals that will be injected by worker
/* global drawFaceOutline, getOC, GCWithScope, loadFont, drawText, drawPolysides, Drawing, drawRoundedRectangle, fuseBlueprints, BlueprintSketcher, organiseBlueprints, draw */

`;
      // Remove the const {...} = replicad; line that replaceImports adds
      const modifiedCode = code.replace(/^const\s*\{\s*[^}]+\}\s*=\s*replicad;\s*\n/m, '');
      return header + modifiedCode;
    }
  };
}
