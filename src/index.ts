#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SwaggerService } from "./swagger-service.js";

class SwaggerMCPServer {
  private server: Server;
  private swaggerService: SwaggerService;

  constructor() {
    this.server = new Server(
      {
        name: "swagger-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 初始化时使用默认认证配置
    this.swaggerService = new SwaggerService();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_swagger_api",
            description: "从 Swagger/OpenAPI 文档 URL 获取 API 接口信息",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description:
                    "Swagger 文档 URL，支持完整文档地址或具体接口地址",
                },
                operation_id: {
                  type: "string",
                  description: "可选：特定的操作 ID 或接口路径",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "parse_swagger_url",
            description: "解析 Swagger URL 并提取基础信息",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "要解析的 Swagger URL",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "set_swagger_auth",
            description: "设置 Swagger 文档访问的认证信息",
            inputSchema: {
              type: "object",
              properties: {
                username: {
                  type: "string",
                  description: "用户名（用于 Basic 认证）",
                },
                password: {
                  type: "string",
                  description: "密码（用于 Basic 认证）",
                },
                token: {
                  type: "string",
                  description: "Bearer token（用于 Token 认证）",
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_swagger_api":
            return await this.handleGetSwaggerApi(
              args as { url: string; operation_id?: string }
            );

          case "parse_swagger_url":
            return await this.handleParseSwaggerUrl(args as { url: string });

          case "set_swagger_auth":
            return await this.handleSetSwaggerAuth(
              args as { username?: string; password?: string; token?: string }
            );

          default:
            throw new Error(`未知工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `错误: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    });
  }

  private async handleGetSwaggerApi(args: {
    url: string;
    operation_id?: string;
  }) {
    const result = await this.swaggerService.getApiInfo(
      args.url,
      args.operation_id
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleParseSwaggerUrl(args: { url: string }) {
    const result = await this.swaggerService.parseSwaggerUrl(args.url);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSetSwaggerAuth(args: {
    username?: string;
    password?: string;
    token?: string;
  }) {
    this.swaggerService.setAuthConfig({
      username: args.username,
      password: args.password,
      token: args.token,
    });

    return {
      content: [
        {
          type: "text",
          text: "认证配置已更新成功",
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Swagger MCP 服务已启动");
  }
}

const server = new SwaggerMCPServer();
server.run().catch(console.error);
