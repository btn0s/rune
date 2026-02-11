import { commandRegistry } from './index';

async function getParent(parentId?: string): Promise<BaseNode & ChildrenMixin> {
  if (parentId) {
    const node = await figma.getNodeByIdAsync(parentId);
    if (!node) throw new Error(`Parent node not found: ${parentId}`);
    if (!('appendChild' in node)) throw new Error(`Node ${parentId} cannot have children`);
    return node as BaseNode & ChildrenMixin;
  }
  return figma.currentPage;
}

function applyFill(node: GeometryMixin, color?: { r: number; g: number; b: number; a?: number }): void {
  if (!color) {
    node.fills = [];
    return;
  }
  const paint: SolidPaint = {
    type: 'SOLID',
    color: { r: color.r, g: color.g, b: color.b },
    opacity: color.a ?? 1,
  };
  node.fills = [paint];
}

function applyStroke(
  node: GeometryMixin,
  color?: { r: number; g: number; b: number; a?: number },
  weight?: number,
): void {
  if (!color) return;
  const paint: SolidPaint = {
    type: 'SOLID',
    color: { r: color.r, g: color.g, b: color.b },
    opacity: color.a ?? 1,
  };
  node.strokes = [paint];
  if (weight !== undefined) (node as any).strokeWeight = weight;
}

function creationResult(node: SceneNode) {
  return { id: node.id, name: node.name, type: node.type };
}

commandRegistry.set('create_rectangle', async (params) => {
  const { x, y, width, height, name, parentId, fillColor, cornerRadius, strokeColor, strokeWeight, strokeAlign } = params;
  const rect = figma.createRectangle();
  rect.x = x;
  rect.y = y;
  rect.resize(width, height);
  rect.name = name ?? 'Rectangle';
  if (cornerRadius !== undefined) rect.cornerRadius = cornerRadius;
  applyFill(rect, fillColor);
  applyStroke(rect, strokeColor, strokeWeight);
  if (strokeAlign) rect.strokeAlign = strokeAlign;
  (await getParent(parentId)).appendChild(rect);
  return creationResult(rect);
});

commandRegistry.set('create_ellipse', async (params) => {
  const { x, y, width, height, name, parentId, fillColor, strokeColor, strokeWeight, strokeAlign } = params;
  const ellipse = figma.createEllipse();
  ellipse.x = x;
  ellipse.y = y;
  ellipse.resize(width, height);
  ellipse.name = name ?? 'Ellipse';
  applyFill(ellipse, fillColor);
  applyStroke(ellipse, strokeColor, strokeWeight);
  if (strokeAlign) ellipse.strokeAlign = strokeAlign;
  (await getParent(parentId)).appendChild(ellipse);
  return creationResult(ellipse);
});

commandRegistry.set('create_line', async (params) => {
  const { startX, startY, endX, endY, name, parentId, strokeColor, strokeWeight, strokeAlign } = params;
  const line = figma.createLine();
  line.x = startX;
  line.y = startY;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  line.resize(length, 0);
  line.rotation = -Math.atan2(dy, dx) * (180 / Math.PI);
  line.name = name ?? 'Line';
  applyStroke(line, strokeColor ?? { r: 0, g: 0, b: 0 }, strokeWeight ?? 1);
  if (strokeAlign) line.strokeAlign = strokeAlign;
  (await getParent(parentId)).appendChild(line);
  return creationResult(line);
});

commandRegistry.set('create_frame', async (params) => {
  const {
    x, y, width, height, name, parentId, fillColor,
    strokeColor, strokeWeight, strokeAlign,
    layoutMode, layoutWrap,
    paddingTop, paddingRight, paddingBottom, paddingLeft,
    itemSpacing, primaryAxisAlignItems, counterAxisAlignItems,
    layoutSizingHorizontal, layoutSizingVertical,
  } = params;

  const frame = figma.createFrame();
  frame.x = x;
  frame.y = y;
  frame.resize(width, height);
  frame.name = name ?? 'Frame';
  applyFill(frame, fillColor);
  applyStroke(frame, strokeColor, strokeWeight);
  if (strokeAlign) frame.strokeAlign = strokeAlign;

  if (layoutMode && layoutMode !== 'NONE') {
    frame.layoutMode = layoutMode;
    if (layoutWrap) frame.layoutWrap = layoutWrap;
    if (paddingTop !== undefined) frame.paddingTop = paddingTop;
    if (paddingRight !== undefined) frame.paddingRight = paddingRight;
    if (paddingBottom !== undefined) frame.paddingBottom = paddingBottom;
    if (paddingLeft !== undefined) frame.paddingLeft = paddingLeft;
    if (itemSpacing !== undefined) frame.itemSpacing = itemSpacing;
    if (primaryAxisAlignItems) frame.primaryAxisAlignItems = primaryAxisAlignItems;
    if (counterAxisAlignItems) frame.counterAxisAlignItems = counterAxisAlignItems;
    if (layoutSizingHorizontal) frame.layoutSizingHorizontal = layoutSizingHorizontal;
    if (layoutSizingVertical) frame.layoutSizingVertical = layoutSizingVertical;
  }

  (await getParent(parentId)).appendChild(frame);
  return creationResult(frame);
});

commandRegistry.set('create_group', async (params) => {
  const { nodeIds, name } = params;
  if (!nodeIds || nodeIds.length === 0) throw new Error('nodeIds must be a non-empty array');

  const nodes: SceneNode[] = [];
  for (const id of nodeIds) {
    const node = await figma.getNodeByIdAsync(id);
    if (!node) throw new Error(`Node not found: ${id}`);
    nodes.push(node as SceneNode);
  }

  const parent = nodes[0].parent;
  if (!parent) throw new Error('Cannot group nodes without a parent');

  const group = figma.group(nodes, parent);
  group.name = name ?? 'Group';
  return creationResult(group);
});

commandRegistry.set('create_component', async (params) => {
  const { x, y, width, height, name, parentId, fillColor } = params;
  const component = figma.createComponent();
  component.x = x;
  component.y = y;
  component.resize(width, height);
  component.name = name ?? 'Component';
  applyFill(component, fillColor);
  (await getParent(parentId)).appendChild(component);
  return creationResult(component);
});

commandRegistry.set('create_instance', async (params) => {
  const { componentKey, x, y, name, parentId } = params;
  const component = await figma.importComponentByKeyAsync(componentKey);
  const instance = component.createInstance();
  instance.x = x;
  instance.y = y;
  if (name) instance.name = name;
  (await getParent(parentId)).appendChild(instance);
  return creationResult(instance);
});

commandRegistry.set('create_text', async (params) => {
  const {
    x, y, text, fontSize, fontFamily, fontWeight,
    fontColor, textAlignHorizontal, letterSpacing, lineHeight,
    name, parentId,
  } = params;

  const family = fontFamily ?? 'Inter';
  const style = fontWeightToStyle(fontWeight ?? 400);

  await figma.loadFontAsync({ family, style });

  const textNode = figma.createText();
  textNode.x = x;
  textNode.y = y;
  textNode.fontName = { family, style };
  textNode.fontSize = fontSize ?? 14;
  textNode.characters = text;
  textNode.name = name ?? 'Text';

  if (fontColor) {
    const paint: SolidPaint = {
      type: 'SOLID',
      color: { r: fontColor.r, g: fontColor.g, b: fontColor.b },
      opacity: fontColor.a ?? 1,
    };
    textNode.fills = [paint];
  }

  if (textAlignHorizontal) {
    textNode.textAlignHorizontal = textAlignHorizontal;
  }

  if (letterSpacing !== undefined) {
    textNode.letterSpacing = { value: letterSpacing, unit: 'PERCENT' };
  }

  if (lineHeight !== undefined) {
    textNode.lineHeight = lineHeight === 'AUTO'
      ? { unit: 'AUTO' }
      : { value: lineHeight, unit: 'PIXELS' };
  }

  (await getParent(parentId)).appendChild(textNode);
  return creationResult(textNode);
});

commandRegistry.set('create_vector', async (params) => {
  const { x, y, width, height, name, parentId, svgPath, fillColor, strokeColor, strokeWeight, strokeAlign } = params;
  const vector = figma.createVector();
  vector.x = x ?? 0;
  vector.y = y ?? 0;
  vector.name = name ?? 'Vector';

  if (svgPath) {
    vector.vectorPaths = [{
      windingRule: 'NONZERO',
      data: svgPath,
    }];
  }

  if (width && height) vector.resize(width, height);
  applyFill(vector, fillColor);
  applyStroke(vector, strokeColor, strokeWeight);
  if (strokeAlign) vector.strokeAlign = strokeAlign;

  (await getParent(parentId)).appendChild(vector);
  return creationResult(vector);
});

function fontWeightToStyle(weight: number): string {
  const map: Record<number, string> = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  };
  return map[weight] ?? 'Regular';
}
