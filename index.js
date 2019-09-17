const htmlparser2 = require("htmlparser2");
const { ElementType } = htmlparser2;

module.exports = function(source) {
  const parsedTemplate = parseTemplate(source);
  return `module.exports = ${ JSON.stringify(parsedTemplate) }`;
}

const attrsToReplace = [
  { name: 'nr-for', prop: 'loopExpression' },
  { name: 'nr-if', prop: 'condition' },
]

function parseTemplate(templateHTML) {
  const dom = htmlparser2.parseDOM(templateHTML);
  const rootNode = dom.filter(node => node.type === ElementType.Tag)[0];

  result = applyParsingTransformations(parseNode(rootNode));
  return result;
}

function parseNode(node) {
  const result = {
    type: node.nodeType
  };

  switch (node.type) {
    case ElementType.Text:
      result.value = node.nodeValue;
      break;

    case ElementType.Tag:
      result.name = node.tagName.toLowerCase();
      result.attributes = [];
      for (let attrName in node.attribs) {
        if (Object.prototype.hasOwnProperty.call(node.attribs, attrName)) {
          let name = attrName.toLowerCase(),
              value = node.attribs[attrName];

          result.attributes.push({ name, value });
        }
      }

      result.children = [];
      for (let i = 0; i < node.childNodes.length; i++) {
        let childNode = node.childNodes[i];
        if (childNode.type !== ElementType.Text && childNode.type !== ElementType.Tag) continue;
        if (childNode.type === ElementType.Text && !childNode.nodeValue.trim()) continue;
        result.children.push(parseNode(childNode));
      }

      break;
  }

  return result;
}

function applyParsingTransformations(templateNode) {
  replaceCustomAttributes(templateNode);
  for (let i = 0; i < templateNode.children.length; i++) {
    const child = templateNode.children[i];
    if (child.type === 1) {
      applyParsingTransformations(child);
    }
  }
  return templateNode;
}

function replaceCustomAttributes(node) {
  for (let i = 0; i < attrsToReplace.length; i++) {
    const customAttrName = attrsToReplace[i].name;
    const customAttrProp = attrsToReplace[i].prop;

    for (let j = 0; j < node.attributes.length; j++) {
      const currentAttrName = node.attributes[j].name;
      const currentAttrValue = node.attributes[j].value;

      if (currentAttrName === customAttrName) {
        // remove custom attribute from the list of parsed attributes
        node.attributes.splice(j, 1);
        j--;

        // create child node
        const wrappedNode = {
          name: node.name,
          type: node.type,
          attributes: Array.prototype.slice.call(node.attributes),
          children: node.children,
        }

        // modify current node to become custom component
        node.name = customAttrName;
        node.children = [wrappedNode];
        node[customAttrProp] = currentAttrValue;
        node.attributes.splice(0, node.attributes.length);
      }
    }

  }

}
