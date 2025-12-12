/**
 * SVG Transform utilities
 * Parses and applies SVG transform attributes to coordinates
 */

/**
 * Parse an SVG transform string into a transformation matrix
 * Supports: translate, matrix, scale, rotate, skewX, skewY
 * 
 * @param {string} transformStr - SVG transform attribute value
 * @returns {number[]} - 6-element transformation matrix [a, b, c, d, e, f]
 */
export function parseTransform(transformStr) {
  if (!transformStr) {
    // Identity matrix
    return [1, 0, 0, 1, 0, 0];
  }

  // Parse transform functions: translate(...), matrix(...), etc.
  const transforms = [];
  const regex = /(\w+)\s*\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(transformStr)) !== null) {
    const type = match[1];
    const args = match[2].split(/[\s,]+/).map(parseFloat);
    transforms.push({ type, args });
  }

  // Start with identity matrix
  let matrix = [1, 0, 0, 1, 0, 0];

  // Apply transforms in order (left to right)
  for (const { type, args } of transforms) {
    matrix = multiplyMatrices(matrix, createTransformMatrix(type, args));
  }

  return matrix;
}

/**
 * Create a transformation matrix from a transform function
 * 
 * @param {string} type - Transform type (translate, matrix, scale, rotate, skewX, skewY)
 * @param {number[]} args - Transform arguments
 * @returns {number[]} - 6-element transformation matrix [a, b, c, d, e, f]
 */
function createTransformMatrix(type, args) {
  switch (type) {
    case 'translate': {
      const tx = args[0] || 0;
      const ty = args[1] || 0;
      return [1, 0, 0, 1, tx, ty];
    }
    
    case 'matrix': {
      // matrix(a, b, c, d, e, f)
      return args.length === 6 ? args : [1, 0, 0, 1, 0, 0];
    }
    
    case 'scale': {
      const sx = args[0] || 1;
      const sy = args[1] !== undefined ? args[1] : sx;
      return [sx, 0, 0, sy, 0, 0];
    }
    
    case 'rotate': {
      const angle = (args[0] || 0) * Math.PI / 180;
      const cx = args[1] || 0;
      const cy = args[2] || 0;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      if (cx === 0 && cy === 0) {
        return [cos, sin, -sin, cos, 0, 0];
      } else {
        // rotate(angle, cx, cy) = translate(cx, cy) rotate(angle) translate(-cx, -cy)
        return multiplyMatrices(
          [1, 0, 0, 1, cx, cy],
          multiplyMatrices(
            [cos, sin, -sin, cos, 0, 0],
            [1, 0, 0, 1, -cx, -cy]
          )
        );
      }
    }
    
    case 'skewX': {
      const angle = (args[0] || 0) * Math.PI / 180;
      return [1, 0, Math.tan(angle), 1, 0, 0];
    }
    
    case 'skewY': {
      const angle = (args[0] || 0) * Math.PI / 180;
      return [1, Math.tan(angle), 0, 1, 0, 0];
    }
    
    default:
      // Unknown transform, return identity
      return [1, 0, 0, 1, 0, 0];
  }
}

/**
 * Multiply two transformation matrices
 * Matrix format: [a, b, c, d, e, f] representing:
 * | a  c  e |
 * | b  d  f |
 * | 0  0  1 |
 * 
 * @param {number[]} m1 - First matrix
 * @param {number[]} m2 - Second matrix
 * @returns {number[]} - Result matrix
 */
function multiplyMatrices(m1, m2) {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1
  ];
}

/**
 * Check if a matrix is the identity matrix
 * 
 * @param {number[]} matrix - Transformation matrix
 * @returns {boolean} - True if identity matrix
 */
function isIdentityMatrix(matrix) {
  const [a, b, c, d, e, f] = matrix;
  return a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0;
}

/**
 * Apply a transformation matrix to a point
 * 
 * @param {number[]} matrix - Transformation matrix [a, b, c, d, e, f]
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number[]} - Transformed [x, y]
 */
export function applyTransform(matrix, x, y) {
  const [a, b, c, d, e, f] = matrix;
  return [
    a * x + c * y + e,
    b * x + d * y + f
  ];
}

/**
 * Format a number for SVG path data (remove unnecessary decimals)
 * 
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
  // Round to 6 decimal places to avoid floating point errors
  const rounded = Math.round(num * 1000000) / 1000000;
  return rounded.toString();
}

/**
 * Apply transforms to an SVG path data string
 * Uses path-data-parser for robust parsing and transformation
 * 
 * @param {string} pathData - SVG path d attribute
 * @param {number[]} matrix - Transformation matrix
 * @returns {string} - Transformed path data
 */
export function transformPathData(pathData, matrix) {
  // If identity matrix, return unchanged
  if (isIdentityMatrix(matrix)) {
    return pathData;
  }

  // Parse path using simple regex - handle both absolute and relative commands
  const commands = [];
  const regex = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
  let currentCommand = null;
  let args = [];
  let match;

  while ((match = regex.exec(pathData)) !== null) {
    if (match[1]) {
      // Save previous command
      if (currentCommand) {
        commands.push({ cmd: currentCommand, args: [...args] });
      }
      currentCommand = match[1];
      args = [];
    } else if (match[2]) {
      args.push(parseFloat(match[2]));
    }
  }
  
  // Save last command
  if (currentCommand) {
    commands.push({ cmd: currentCommand, args: [...args] });
  }

  // Transform commands and build output
  const output = [];
  let currentPos = [0, 0]; // Track current position for relative commands
  
  for (const { cmd, args } of commands) {
    const result = transformCommand(cmd, args, matrix, currentPos);
    output.push(result.output);
    if (result.newPos) {
      currentPos = result.newPos;
    }
  }

  return output.join('');
}

/**
 * Transform a single SVG path command
 * 
 * @param {string} cmd - Command letter
 * @param {number[]} args - Command arguments
 * @param {number[]} matrix - Transformation matrix
 * @param {number[]} currentPos - Current position [x, y]
 * @returns {object} - {output: string, newPos: [x, y]}
 */
function transformCommand(cmd, args, matrix, currentPos) {
  const isRelative = cmd === cmd.toLowerCase();
  const cmdUpper = cmd.toUpperCase();
  
  // Close path - no transformation needed
  if (cmdUpper === 'Z') {
    return { output: 'Z', newPos: null };
  }
  
  // Convert relative coordinates to absolute for transformation
  const toAbsolute = (x, y) => {
    return isRelative ? [currentPos[0] + x, currentPos[1] + y] : [x, y];
  };
  
  const parts = [];
  let newPos = currentPos;
  
  switch (cmdUpper) {
    case 'M':
    case 'L':
    case 'T': {
      // Move/Line/Smooth quadratic - pairs of x,y coordinates
      parts.push(cmdUpper);
      for (let i = 0; i < args.length; i += 2) {
        const [x, y] = toAbsolute(args[i], args[i + 1]);
        const [tx, ty] = applyTransform(matrix, x, y);
        parts.push(formatNumber(tx) + ',' + formatNumber(ty));
        newPos = [tx, ty];
      }
      break;
    }
    
    case 'H': {
      // Horizontal line - convert to L after transform
      parts.push('L');
      for (let i = 0; i < args.length; i++) {
        const [x, y] = toAbsolute(args[i], 0);
        const [tx, ty] = applyTransform(matrix, x, y);
        parts.push(formatNumber(tx) + ',' + formatNumber(ty));
        newPos = [tx, ty];
      }
      break;
    }
    
    case 'V': {
      // Vertical line - convert to L after transform
      parts.push('L');
      for (let i = 0; i < args.length; i++) {
        const [x, y] = toAbsolute(0, args[i]);
        const [tx, ty] = applyTransform(matrix, x, y);
        parts.push(formatNumber(tx) + ',' + formatNumber(ty));
        newPos = [tx, ty];
      }
      break;
    }
    
    case 'C': {
      // Cubic bezier: x1,y1 x2,y2 x,y
      parts.push(cmdUpper);
      for (let i = 0; i < args.length; i += 6) {
        const [x1, y1] = toAbsolute(args[i], args[i + 1]);
        const [x2, y2] = toAbsolute(args[i + 2], args[i + 3]);
        const [x, y] = toAbsolute(args[i + 4], args[i + 5]);
        
        const [tx1, ty1] = applyTransform(matrix, x1, y1);
        const [tx2, ty2] = applyTransform(matrix, x2, y2);
        const [tx, ty] = applyTransform(matrix, x, y);
        
        parts.push(
          formatNumber(tx1) + ',' + formatNumber(ty1),
          formatNumber(tx2) + ',' + formatNumber(ty2),
          formatNumber(tx) + ',' + formatNumber(ty)
        );
        newPos = [tx, ty];
      }
      break;
    }
    
    case 'S': {
      // Smooth cubic bezier: x2,y2 x,y
      parts.push(cmdUpper);
      for (let i = 0; i < args.length; i += 4) {
        const [x2, y2] = toAbsolute(args[i], args[i + 1]);
        const [x, y] = toAbsolute(args[i + 2], args[i + 3]);
        
        const [tx2, ty2] = applyTransform(matrix, x2, y2);
        const [tx, ty] = applyTransform(matrix, x, y);
        
        parts.push(
          formatNumber(tx2) + ',' + formatNumber(ty2),
          formatNumber(tx) + ',' + formatNumber(ty)
        );
        newPos = [tx, ty];
      }
      break;
    }
    
    case 'Q': {
      // Quadratic bezier: x1,y1 x,y
      parts.push(cmdUpper);
      for (let i = 0; i < args.length; i += 4) {
        const [x1, y1] = toAbsolute(args[i], args[i + 1]);
        const [x, y] = toAbsolute(args[i + 2], args[i + 3]);
        
        const [tx1, ty1] = applyTransform(matrix, x1, y1);
        const [tx, ty] = applyTransform(matrix, x, y);
        
        parts.push(
          formatNumber(tx1) + ',' + formatNumber(ty1),
          formatNumber(tx) + ',' + formatNumber(ty)
        );
        newPos = [tx, ty];
      }
      break;
    }
    
    case 'A': {
      // Arc: rx,ry rotation large-arc sweep x,y
      // Arc transformation is complex - for now, just transform endpoint
      // Full arc transformation requires ellipse decomposition
      // TODO: Implement proper arc transformation
      parts.push(cmdUpper);
      for (let i = 0; i < args.length; i += 7) {
        const rx = args[i];
        const ry = args[i + 1];
        const rotation = args[i + 2];
        const largeArc = args[i + 3];
        const sweep = args[i + 4];
        const [x, y] = toAbsolute(args[i + 5], args[i + 6]);
        const [tx, ty] = applyTransform(matrix, x, y);
        
        parts.push(
          formatNumber(rx) + ',' + formatNumber(ry),
          formatNumber(rotation),
          largeArc.toString(),
          sweep.toString(),
          formatNumber(tx) + ',' + formatNumber(ty)
        );
        newPos = [tx, ty];
      }
      break;
    }
    
    default: {
      // Unknown command - pass through as-is
      parts.push(cmd);
      if (args.length > 0) {
        parts.push(args.join(','));
      }
    }
  }
  
  return { 
    output: parts.join(' '), 
    newPos 
  };
}

/**
 * Transform ellipse/circle parameters
 * Handles translation, but scale/rotation require converting to path
 * 
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} rx - Radius X
 * @param {number} ry - Radius Y
 * @param {number[]} matrix - Transformation matrix
 * @returns {object} - Transformed {cx, cy, rx, ry} or {shouldConvertToPath: true, pathData: string}
 */
export function transformEllipse(cx, cy, rx, ry, matrix) {
  const [a, b, c, d, e, f] = matrix;
  
  // Check if transform is simple (translation only)
  if (a === 1 && b === 0 && c === 0 && d === 1) {
    // Translation only - just move center
    return { 
      cx: cx + e, 
      cy: cy + f, 
      rx, 
      ry 
    };
  }
  
  // For scale/rotation/skew, we should convert ellipse to path for accurate transformation
  // But for simplicity, just transform center and warn about limitations
  // A proper implementation would convert ellipse to cubic bezier curves
  
  const [newCx, newCy] = applyTransform(matrix, cx, cy);
  
  // Approximate radius transformation (not accurate for rotation/skew)
  const [rx1] = applyTransform(matrix, rx, 0);
  const [, ry1] = applyTransform(matrix, 0, ry);
  
  return { 
    cx: newCx, 
    cy: newCy, 
    rx: Math.abs(rx1 - e), 
    ry: Math.abs(ry1 - f)
  };
}

/**
 * Transform rectangle parameters
 * For complex transforms, should convert to path
 * 
 * @param {number} x - Top-left X
 * @param {number} y - Top-left Y
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number[]} matrix - Transformation matrix
 * @returns {object} - Transformed {x, y, width, height}
 */
export function transformRect(x, y, width, height, matrix) {
  const [a, b, c, d, e, f] = matrix;
  
  // Check if transform is simple (translation only)
  if (a === 1 && b === 0 && c === 0 && d === 1) {
    // Translation only
    return { 
      x: x + e, 
      y: y + f, 
      width, 
      height 
    };
  }
  
  // For scale/rotation/skew, transform all corners and compute bounding box
  const corners = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height]
  ];
  
  const transformed = corners.map(([cx, cy]) => applyTransform(matrix, cx, cy));
  
  const xs = transformed.map(([tx]) => tx);
  const ys = transformed.map(([, ty]) => ty);
  
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}
