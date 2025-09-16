import axios from "axios";
import * as cheerio from "cheerio";
import { parse as parseYaml } from "yaml";
import https from "https";

interface ApiInfo {
  operationId?: string;
  method: string;
  path: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
  tags?: string[];
  // 新增字段：解析后的响应结构
  responseSchemas?: any;
  // 新增字段：解析后的请求结构
  requestSchemas?: any;
}

interface SwaggerUrlInfo {
  baseUrl: string;
  docUrl: string;
  operationId?: string;
  method?: string;
  path?: string;
}

interface AuthConfig {
  username?: string;
  password?: string;
  token?: string;
}

export class SwaggerService {
  private authConfig: AuthConfig;
  private cachedSpec: any = null; // 缓存解析的规范

  constructor(authConfig?: AuthConfig) {
    this.authConfig = authConfig || {
      username: "swagger",
      password:
        "aMSEYXan3TMxVW0b0uFdG1Coe5fcWZyjp1GuMtCldwffkqcLvFV6kAhjHKXpWoxY1aOk2jPDPz25QRGJZeBaAjJFVp4PY0TF1ZGE",
    };
  }

  /**
   * 设置认证配置
   */
  setAuthConfig(authConfig: AuthConfig) {
    this.authConfig = authConfig;
  }

  /**
   * 解析 $ref 引用
   */
  private resolveRef(ref: string, spec: any): any {
    if (!ref || !ref.startsWith("#/")) {
      return null;
    }

    const path = ref.replace("#/", "").split("/");
    let current = spec;

    for (const segment of path) {
      if (current && typeof current === "object" && current[segment]) {
        current = current[segment];
      } else {
        return null;
      }
    }

    return current;
  }

  /**
   * 递归解析 schema，展开所有 $ref 引用
   */
  private resolveSchema(
    schema: any,
    spec: any,
    visited: Set<string> = new Set()
  ): any {
    if (!schema || typeof schema !== "object") {
      return schema;
    }

    // 处理 $ref
    if (schema.$ref) {
      if (visited.has(schema.$ref)) {
        return { type: "object", description: `循环引用: ${schema.$ref}` };
      }

      visited.add(schema.$ref);
      const resolved = this.resolveRef(schema.$ref, spec);
      if (resolved) {
        return this.resolveSchema(resolved, spec, new Set(visited));
      }
      return { type: "object", description: `无法解析引用: ${schema.$ref}` };
    }

    // 处理数组
    if (schema.type === "array" && schema.items) {
      return {
        ...schema,
        items: this.resolveSchema(schema.items, spec, new Set(visited)),
      };
    }

    // 处理对象属性
    if (schema.properties) {
      const resolvedProperties: any = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        resolvedProperties[key] = this.resolveSchema(
          value,
          spec,
          new Set(visited)
        );
      }
      return {
        ...schema,
        properties: resolvedProperties,
      };
    }

    // 处理 allOf, oneOf, anyOf
    if (schema.allOf) {
      const resolved = schema.allOf.map((item: any) =>
        this.resolveSchema(item, spec, new Set(visited))
      );
      return { ...schema, allOf: resolved };
    }
    if (schema.oneOf) {
      const resolved = schema.oneOf.map((item: any) =>
        this.resolveSchema(item, spec, new Set(visited))
      );
      return { ...schema, oneOf: resolved };
    }
    if (schema.anyOf) {
      const resolved = schema.anyOf.map((item: any) =>
        this.resolveSchema(item, spec, new Set(visited))
      );
      return { ...schema, anyOf: resolved };
    }

    return schema;
  }

  /**
   * 解析响应 schema
   */
  private parseResponseSchemas(responses: any, spec: any): any {
    if (!responses) return null;

    const resolvedResponses: any = {};
    for (const [statusCode, response] of Object.entries(responses)) {
      if (response && typeof response === "object") {
        const responseObj = response as any;
        resolvedResponses[statusCode] = {
          description: responseObj.description,
          content: {},
        };

        if (responseObj.content) {
          for (const [mediaType, mediaObj] of Object.entries(
            responseObj.content
          )) {
            if (mediaObj && typeof mediaObj === "object") {
              const mediaContent = mediaObj as any;
              if (mediaContent.schema) {
                resolvedResponses[statusCode].content[mediaType] = {
                  schema: this.resolveSchema(mediaContent.schema, spec),
                };
              }
            }
          }
        }
      }
    }

    return resolvedResponses;
  }

  /**
   * 解析请求体 schema
   */
  private parseRequestSchemas(requestBody: any, spec: any): any {
    if (!requestBody) return null;

    const resolved: any = {
      description: requestBody.description,
      required: requestBody.required,
      content: {},
    };

    if (requestBody.content) {
      for (const [mediaType, mediaObj] of Object.entries(requestBody.content)) {
        if (mediaObj && typeof mediaObj === "object") {
          const mediaContent = mediaObj as any;
          if (mediaContent.schema) {
            resolved.content[mediaType] = {
              schema: this.resolveSchema(mediaContent.schema, spec),
            };
          }
        }
      }
    }

    return resolved;
  }

  /**
   * 解析 Swagger URL 并提取基础信息
   */
  async parseSwaggerUrl(url: string): Promise<SwaggerUrlInfo> {
    try {
      // 解析 URL 中的操作信息
      const urlObj = new URL(url);
      const hash = urlObj.hash;

      let operationId: string | undefined;
      let method: string | undefined;
      let path: string | undefined;

      // 从 hash 中提取操作信息 (如: #/default/线索-接口/saveUsingPOST_2)
      if (hash) {
        const hashParts = hash.split("/");
        if (hashParts.length >= 3) {
          operationId = hashParts[hashParts.length - 1];

          // 尝试从操作ID推断方法
          if (operationId.includes("POST")) method = "POST";
          else if (operationId.includes("GET")) method = "GET";
          else if (operationId.includes("PUT")) method = "PUT";
          else if (operationId.includes("DELETE")) method = "DELETE";
          else if (operationId.includes("PATCH")) method = "PATCH";
        }
      }

      // 构建基础 URL 和文档 URL
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      const docUrl = this.buildDocUrl(url);

      return {
        baseUrl,
        docUrl,
        operationId,
        method,
        path,
      };
    } catch (error) {
      throw new Error(
        `解析 URL 失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 从给定 URL 获取 API 信息
   */
  async getApiInfo(
    url: string,
    targetOperationId?: string
  ): Promise<ApiInfo[]> {
    try {
      const urlInfo = await this.parseSwaggerUrl(url);
      const spec = await this.fetchSwaggerSpec(urlInfo.docUrl);

      if (!spec) {
        throw new Error("无法获取 Swagger 规范");
      }

      // 缓存规范以供 schema 解析使用
      this.cachedSpec = spec;

      // 解析规范并提取 API 信息
      const apis = this.extractApiInfo(spec);

      // 如果指定了操作ID或从URL解析出操作ID，则过滤结果
      const operationId = targetOperationId || urlInfo.operationId;
      if (operationId) {
        return apis.filter(
          (api) =>
            api.operationId === operationId ||
            api.operationId?.includes(operationId) ||
            operationId.includes(api.operationId || "")
        );
      }

      return apis;
    } catch (error) {
      throw new Error(
        `获取 API 信息失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 构建文档 URL
   */
  private buildDocUrl(originalUrl: string): string {
    try {
      const urlObj = new URL(originalUrl);

      // 如果是 doc.html 页面，尝试找到对应的 API 文档
      if (originalUrl.includes("doc.html")) {
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
        const pathParts = urlObj.pathname.split("/");

        // 移除 doc.html 部分
        const basePath = pathParts.slice(0, -1).join("/");

        // 先尝试 swagger-resources（这个端点认证有效）
        return `${baseUrl}${basePath}/swagger-resources`;
      }

      return originalUrl;
    } catch (error) {
      return originalUrl;
    }
  }

  /**
   * 获取认证头信息
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "swagger-mcp-client",
    };

    if (this.authConfig.username && this.authConfig.password) {
      const credentials = Buffer.from(
        `${this.authConfig.username}:${this.authConfig.password}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    } else if (this.authConfig.token) {
      headers["Authorization"] = `Bearer ${this.authConfig.token}`;
    }

    return headers;
  }

  /**
   * 获取 Swagger 规范
   */
  private async fetchSwaggerSpec(docUrl: string): Promise<any> {
    try {
      const headers = this.getAuthHeaders();

      // 如果是 swagger-resources 端点，先获取资源列表
      if (docUrl.includes("swagger-resources")) {
        try {
          console.error(`获取 Swagger 资源列表: ${docUrl}`);
          const resourcesResponse = await axios.get(docUrl, {
            timeout: 10000,
            headers,
            httpsAgent: new https.Agent({
              rejectUnauthorized: false,
            }),
          });

          if (resourcesResponse.data && Array.isArray(resourcesResponse.data)) {
            // 获取第一个资源的 URL
            const firstResource = resourcesResponse.data[0];
            if (firstResource && firstResource.url) {
              const baseUrl = docUrl.replace("/swagger-resources", "");
              const actualDocUrl = `${baseUrl}${firstResource.url}`;
              console.error(`获取实际文档: ${actualDocUrl}`);

              const specResponse = await axios.get(actualDocUrl, {
                timeout: 10000,
                headers,
                httpsAgent: new https.Agent({
                  rejectUnauthorized: false,
                }),
              });

              let spec = specResponse.data;
              if (typeof spec === "string") {
                try {
                  spec = JSON.parse(spec);
                } catch {
                  spec = parseYaml(spec);
                }
              }

              if (spec && (spec.swagger || spec.openapi) && spec.paths) {
                console.error(
                  `成功获取到 Swagger 规范，包含 ${
                    Object.keys(spec.paths).length
                  } 个路径`
                );
                return spec;
              }
            }
          }
        } catch (error) {
          console.error(
            `swagger-resources 失败:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }

      // 尝试多个可能的文档 URL（回退方案）
      const urlsToTry = [
        docUrl,
        docUrl.replace("/doc.html", "/v2/api-docs"),
        docUrl.replace("/doc.html", "/v3/api-docs"),
        docUrl.replace("/doc.html", "/api-docs"),
        docUrl.replace("/swagger-resources", "/v2/api-docs"),
      ];

      for (const url of urlsToTry) {
        try {
          console.error(`尝试获取: ${url}`);
          console.error(`使用认证: ${this.authConfig.username ? "是" : "否"}`);

          const response = await axios.get(url, {
            timeout: 10000,
            headers,
            httpsAgent: new https.Agent({
              rejectUnauthorized: false,
            }),
          });

          if (response.data) {
            // 如果是字符串，尝试解析为 JSON 或 YAML
            let spec = response.data;
            if (typeof spec === "string") {
              try {
                spec = JSON.parse(spec);
              } catch {
                spec = parseYaml(spec);
              }
            }

            // 验证是否为有效的 OpenAPI/Swagger 规范
            if (spec && (spec.swagger || spec.openapi) && spec.paths) {
              console.error(
                `成功获取到 Swagger 规范，包含 ${
                  Object.keys(spec.paths).length
                } 个路径`
              );
              return spec;
            }
          }
        } catch (error) {
          console.error(
            `URL ${url} 失败:`,
            error instanceof Error ? error.message : String(error)
          );
          continue;
        }
      }

      throw new Error("无法从任何 URL 获取有效的 Swagger 规范");
    } catch (error) {
      throw new Error(
        `获取 Swagger 规范失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 从 Swagger 规范中提取 API 信息
   */
  private extractApiInfo(spec: any): ApiInfo[] {
    const apis: ApiInfo[] = [];

    if (!spec.paths) {
      return apis;
    }

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      if (!pathItem || typeof pathItem !== "object") continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!operation || typeof operation !== "object") continue;
        if (["parameters", "summary", "description"].includes(method)) continue;

        const operationObj = operation as any;

        // 解析响应 schemas
        const responseSchemas = this.parseResponseSchemas(
          operationObj.responses,
          spec
        );

        // 解析请求 schemas
        const requestSchemas = this.parseRequestSchemas(
          operationObj.requestBody,
          spec
        );

        const apiInfo: ApiInfo = {
          method: method.toUpperCase(),
          path,
          operationId: operationObj.operationId,
          summary: operationObj.summary,
          description: operationObj.description,
          tags: operationObj.tags,
          parameters: operationObj.parameters,
          requestBody: operationObj.requestBody,
          responses: operationObj.responses,
          responseSchemas,
          requestSchemas,
        };

        apis.push(apiInfo);
      }
    }

    return apis;
  }
}
