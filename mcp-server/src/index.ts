#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.OPENSCHEMAEXTRACT_API_KEY;
const API_URL = process.env.OPENSCHEMAEXTRACT_API_URL || "https://openschemaextract.com/api/extract";

interface SchemaBlock {
  format: string;
  type: string;
  data: Record<string, unknown>;
}

interface ExtractResult {
  success: boolean;
  data?: {
    url: string;
    schemaTypes: string[];
    blocks: SchemaBlock[];
    byType: Record<string, SchemaBlock[]>;
  };
  error?: string;
  errorCode?: string;
}

async function extractSchema(url: string): Promise<ExtractResult> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (API_KEY) {
    headers.Authorization = `Bearer ${API_KEY}`;
  }

  const response = await fetch(`${API_URL}?url=${encodeURIComponent(url)}`, {
    headers,
  });

  return response.json() as Promise<ExtractResult>;
}

const server = new Server(
  {
    name: "openschemaextract",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "extract_schema",
        description:
          "Extract structured data (JSON-LD, Microdata, RDFa) from any URL. Returns schema.org types, blocks, and detailed statistics.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to extract structured data from (e.g., https://schema.org/Recipe)",
            },
          },
          required: ["url"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "extract_schema") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const url = request.params.arguments?.url;
  if (!url || typeof url !== "string") {
    throw new Error("Missing required parameter: url");
  }

  try {
    const result = await extractSchema(url);

    if (!result.success || !result.data) {
      return {
        content: [
          {
            type: "text",
            text: `Error extracting schema: ${result.error || "Unknown error"}\nError code: ${result.errorCode || "N/A"}`,
          },
        ],
      };
    }

    const { data } = result;

    const jsonLdCount = data.blocks.filter(b => b.format === "json-ld").length;
    const microdataCount = data.blocks.filter(b => b.format === "microdata").length;
    const rdfaCount = data.blocks.filter(b => b.format === "rdfa").length;

    const blocksByType = Object.entries(data.byType)
      .map(([type, blocks]) =>
        `### ${type} (${blocks.length})\n${blocks.map(b => `- Format: ${b.format}`).join("\n")}`
      )
      .join("\n\n");

    const summary = `# Schema Extraction Results

**URL**: ${data.url}
**Total Blocks**: ${data.blocks.length}
**Formats Found**: JSON-LD (${jsonLdCount}), Microdata (${microdataCount}), RDFa (${rdfaCount})
**Schema Types**: ${data.schemaTypes.join(", ")}

## Blocks by Type

${blocksByType}`;

    return {
      content: [
        {
          type: "text",
          text: summary,
        },
        {
          type: "text",
          text: `\n\n## Full Data\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP protocol on stdout
  console.error("OpenSchemaExtract MCP server running on stdio");
  if (API_KEY) {
    console.error("✓ Using API key for authentication");
  } else {
    console.error("⚠ No API key set (using public demo - rate limited)");
    console.error("  Set OPENSCHEMAEXTRACT_API_KEY environment variable for unlimited access");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
