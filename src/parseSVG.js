import { organiseBlueprints, Drawing } from "replicad";
import { DOMParser } from "xmldom";

import { fuseIntersectingBlueprints } from "./blueprintHelpers";
import {
  roundedRectangleBlueprint,
  SVGPathBlueprint,
  ellipseBlueprint,
} from "./svgShapes";
import { 
  parseTransform, 
  transformPathData, 
  transformEllipse, 
  transformRect 
} from "./svgTransforms";

export function drawSVG(svg, { width, alwaysClosePaths = false } = {}) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "text/html");

  let blueprints = [];
  
  // Cache parsed transform matrices to avoid re-parsing identical transforms
  const transformCache = new Map();
  
  const getTransformMatrix = (transformAttr) => {
    if (!transformAttr) return null;
    if (!transformCache.has(transformAttr)) {
      transformCache.set(transformAttr, parseTransform(transformAttr));
    }
    return transformCache.get(transformAttr);
  };

  // Process path elements
  // Note: Using Array.from() because xmldom's getElementsByTagName returns a non-standard NodeList
  for (let path of Array.from(doc.getElementsByTagName("path"))) {
    let commands = path.getAttribute("d");
    const transformAttr = path.getAttribute("transform");
    
    // Apply transforms if present
    const matrix = getTransformMatrix(transformAttr);
    if (matrix) {
      commands = transformPathData(commands, matrix);
    }
    
    const pathBlueprints = Array.from(
      SVGPathBlueprint(commands, alwaysClosePaths)
    );
    blueprints.push(...pathBlueprints);
  }

  // Process polygon elements
  for (let polygon of Array.from(doc.getElementsByTagName("polygon"))) {
    let commands = polygon.getAttribute("points");
    const transformAttr = polygon.getAttribute("transform");
    
    // Apply transforms if present
    const matrix = getTransformMatrix(transformAttr);
    if (matrix) {
      commands = transformPathData(`M${commands}z`, matrix);
      blueprints.push(...Array.from(SVGPathBlueprint(commands)));
    } else {
      blueprints.push(...Array.from(SVGPathBlueprint(`M${commands}z`)));
    }
  }

  // Process rect elements
  for (let rect of Array.from(doc.getElementsByTagName("rect"))) {
    let x = parseFloat(rect.getAttribute("x")) || 0;
    let y = parseFloat(rect.getAttribute("y")) || 0;
    let rectWidth = parseFloat(rect.getAttribute("width")) || 0;
    let rectHeight = parseFloat(rect.getAttribute("height")) || 0;
    const transformAttr = rect.getAttribute("transform");

    // Apply transforms if present
    const matrix = getTransformMatrix(transformAttr);
    if (matrix) {
      const transformed = transformRect(x, y, rectWidth, rectHeight, matrix);
      x = transformed.x;
      y = transformed.y;
      rectWidth = transformed.width;
      rectHeight = transformed.height;
    }

    let rx = parseFloat(rect.getAttribute("rx")) || 0;
    let ry = parseFloat(rect.getAttribute("ry")) || 0;

    blueprints.push(
      roundedRectangleBlueprint({
        x,
        y,
        rx,
        ry,
        width: rectWidth,
        height: rectHeight,
      })
    );
  }

  // Process circle elements
  for (let circle of Array.from(doc.getElementsByTagName("circle"))) {
    let cx = parseFloat(circle.getAttribute("cx")) || 0;
    let cy = parseFloat(circle.getAttribute("cy")) || 0;
    let r = parseFloat(circle.getAttribute("r")) || 0;
    const transformAttr = circle.getAttribute("transform");

    // Apply transforms if present
    const matrix = getTransformMatrix(transformAttr);
    if (matrix) {
      const transformed = transformEllipse(cx, cy, r, r, matrix);
      cx = transformed.cx;
      cy = transformed.cy;
      r = transformed.rx;
    }

    blueprints.push(ellipseBlueprint({ cx, cy, rx: r, ry: r }));
  }

  // Process ellipse elements
  for (let ellipse of Array.from(doc.getElementsByTagName("ellipse"))) {
    let cx = parseFloat(ellipse.getAttribute("cx")) || 0;
    let cy = parseFloat(ellipse.getAttribute("cy")) || 0;
    let rx = parseFloat(ellipse.getAttribute("rx")) || 0;
    let ry = parseFloat(ellipse.getAttribute("ry")) || 0;
    const transformAttr = ellipse.getAttribute("transform");

    // Apply transforms if present
    const matrix = getTransformMatrix(transformAttr);
    if (matrix) {
      const transformed = transformEllipse(cx, cy, rx, ry, matrix);
      cx = transformed.cx;
      cy = transformed.cy;
      rx = transformed.rx;
      ry = transformed.ry;
    }

    blueprints.push(ellipseBlueprint({ cx, cy, rx, ry }));
  }

  // Transform support implemented via svgTransforms.js

  const fused = fuseIntersectingBlueprints(blueprints);
  let outBlueprints = organiseBlueprints(fused).mirror([1, 0], [0, 0], "plane");

  if (width) {
    const factor = width / outBlueprints.boundingBox.width;
    outBlueprints = outBlueprints.scale(
      factor,
      outBlueprints.boundingBox.center
    );
  }

  return new Drawing(outBlueprints);
}
