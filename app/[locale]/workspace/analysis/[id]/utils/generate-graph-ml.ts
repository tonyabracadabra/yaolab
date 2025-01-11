import type { Edge, GraphData, Node } from "../types";

/**
 * Generates a GraphML format string from the graph data
 * @param graphData The graph data containing nodes and edges
 * @returns A string in GraphML format
 */
export function generateGraphML(graphData: GraphData): string {
  const { nodes, edges } = graphData;

  // Helper to escape XML special characters
  const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
  };

  // Create the GraphML header with schema definitions
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
         http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  
  <!-- Node Attributes -->
  <key id="mz" for="node" attr.name="mz" attr.type="double"/>
  <key id="rt" for="node" attr.name="rt" attr.type="double"/>
  <key id="intensity" for="node" attr.name="intensity" attr.type="double"/>
  <key id="formula" for="node" attr.name="formula" attr.type="string"/>
  <key id="inchikey" for="node" attr.name="inchikey" attr.type="string"/>
  <key id="name" for="node" attr.name="name" attr.type="string"/>
  <key id="smiles" for="node" attr.name="smiles" attr.type="string"/>
  <key id="ratio" for="node" attr.name="ratio" attr.type="double"/>
  <key id="isPrototype" for="node" attr.name="isPrototype" attr.type="boolean"/>
  
  <!-- Edge Attributes -->
  <key id="mzDiff" for="edge" attr.name="mzDiff" attr.type="double"/>
  <key id="rtDiff" for="edge" attr.name="rtDiff" attr.type="double"/>
  <key id="correlation" for="edge" attr.name="correlation" attr.type="double"/>
  <key id="modCos" for="edge" attr.name="modCos" attr.type="double"/>
  <key id="matchedMzDiff" for="edge" attr.name="matchedMzDiff" attr.type="double"/>
  <key id="matchedFormulaChange" for="edge" attr.name="matchedFormulaChange" attr.type="string"/>
  <key id="matchedDescription" for="edge" attr.name="matchedDescription" attr.type="string"/>`;

  // Generate nodes XML
  const nodesXml = nodes
    .map((node: Node) => {
      const attributes = Object.entries(node)
        .filter(([key]) => key !== "id") // Exclude id as it's used as the node identifier
        .map(([key, value]) => {
          if (value === null || value === undefined) return "";
          return `    <data key="${key}">${escapeXml(String(value))}</data>`;
        })
        .filter(Boolean)
        .join("\n");

      return `  <node id="n${node.id}">
${attributes}
  </node>`;
    })
    .join("\n");

  // Generate edges XML
  const edgesXml = edges
    .map((edge: Edge, index: number) => {
      const attributes = Object.entries(edge)
        .filter(([key]) => !["id1", "id2", "source", "target"].includes(key))
        .map(([key, value]) => {
          if (value === null || value === undefined) return "";
          return `    <data key="${key}">${escapeXml(String(value))}</data>`;
        })
        .filter(Boolean)
        .join("\n");

      return `  <edge id="e${index}" source="n${edge.id1}" target="n${edge.id2}">
${attributes}
  </edge>`;
    })
    .join("\n");

  // Combine all parts
  const graphML = `${header}

  <graph id="G" edgedefault="undirected">
${nodesXml}

${edgesXml}
  </graph>
</graphml>`;

  return graphML;
}

/**
 * Downloads the GraphML string as a file
 * @param graphML The GraphML string to download
 * @param filename The name of the file to download
 */
export function downloadGraphML(graphML: string, filename: string): void {
  const blob = new Blob([graphML], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
