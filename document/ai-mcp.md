会议信息
会议主题：前端AI/MCP 提效阶段性方案
会议时间：Aug 21 (Thu) 19:25 - 20:32 (GMT+08)
参会人：@鲍张杰 @陈荣堪 @杜禹 @高英达 @黄恺 @李宪 @龙思源 @王一骅 @韦天昊 @徐超 @杨惠 @袁锦阳 @赵二辉 @庄广谦 
会议议程
前言
我们前端团队一直在关注如何利用 AI 提升开发效率。在之前的探索中，我们有幸和 UE 同学@高英达 一起，对 Figma 设计稿的解析做了一些初步的尝试，初步验证了通过 mcp 工具来打通设计与开发环节的可行性。基于这个经验，我自己也花了点时间，研究了一下接口文档 mcp 的对接，同样也算是有一些小小的收获。
把这些零散的尝试放在一起复盘后，我感觉我们日常开发流程中，确实有一些环节存在“信息搬运”和“流程割裂”的问题，可能正是 AI 能发挥作用的地方。
所以，今天主要是想把我的这些观察和想法抛出来，和大家一起交流探讨，看看我们能不能共同找到一些优化的方向，让我们的协作更顺畅一些。
一、前端开发流程现状分析
当前开发流程可拆解成“需求理解 → 设计稿转代码 → 接口对接 → 业务逻辑开发”四个核心阶段。
目前，像 Cursor、Augment 这样的工具已经成为很多同学的得力助手，它们在代码生成、解释、重构等方面表现出色。
但是，就像从手动挡汽车到自动挡汽车的进化一样，我们当前的 AI 协作方式，仍然存在着大量的“手动操作”，效率还有巨大的提升空间。
暂时无法在飞书文档外展示此内容
核心痛点：当前工作流中的“割裂感”
- 当前与 AI 的协作，本质上是一种“人肉信息搬运”。我们将一个系统的输入（如设计稿、接口文档）手动处理后，再喂给另一个系统（AI 工具）。
- 举例 1 (UI 开发)：
  - 流程： Figma 设计稿 -> 手动截图 -> 发送给 Cursor -> AI 识别（可能出错） -> 生成代码 -> 开发者手动校对、修改
  - 问题： 信息在“截图”这一步已经失真，AI 得到的是非结构化数据，导致还原度和准确性不高，后期修正成本大。
- 举例 2 (业务逻辑开发)：
  - 流程： Swagger 接口文档 -> 手动复制粘贴接口定义 -> 发送给 AI -> 生成 TS 类型、接口、Hooks
  - 问题： 过程繁琐、易出错；接口文档过长会污染 AI 的上下文，影响生成代码的准确性；接口变更后，需要重复整个手动流程，维护性差。
解决方法：“上下文直连”的 MCP 模式
既然手动“喂”资料又累又可能不准，那我们能不能换个思路，让 AI 工具直接连接到我们的“原始资料库”呢？
这个思路的核心，利用 MCP，接入相关工具。可以简单理解成一个标准的“数据读取插件”，让 Cursor 这样的工具能直接去访问像 Figma、Swagger 这样的外部应用，并读取里面的结构化信息。
我的目标很简单：用“分享链接”代替“复制粘贴”。
特性
传统模式（手动投喂）
MCP 模式（链接直连）
数据来源
截图、复制的文本
Figma API, Swagger API
数据类型
非结构化、低保真
结构化、高保真
AI 工作方式
猜测、识别
读取、解析
结果准确性
一般，需大量校对
高，细节精准
工作效率
低，流程割裂
高，端到端自动化
二、一些简单的尝试
基于上面的想法，做了两个小小的尝试，在这里和大家分享一下：
暂时无法在飞书文档外展示此内容
尝试一：连接 Figma —— 让 AI 更准确地理解设计稿
- 怎么做的：主要是利用了 Figma 官方已经提供的 MCP 功能。
  - 初步尝试： 最开始，我们直接使用 Figma 官方提供的 MCP 功能。发现它能准确获取布局、颜色、字体等信息，比截图模式强很多。但很快遇到了第一个瓶颈：它生成的代码全是 div 堆砌的，无法对应到我们项目内部的组件库。
nodeId
"2372-99453"
clientFrameworks
"vue"
clientLanguages
"javascript,html,css,typescript"
output
function LineCloseErrorLight2Px() {
  return (
    <div className="relative size-full" data-name="line_close&errorLight-2px" data-node-id="1:211">
      <div className="absolute inset-[20.84%_20.83%_20.83%_20.83%]" data-name="Original" data-node-id="1:214">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
          <path
            d="M12.2929 0.292893C12.6834 -0.097631 13.3164 -0.0976311 13.707 0.292893C14.0974 0.683423 14.0975 1.31645 13.707 1.70696L8.41399 6.99992L13.707 12.2929L13.7753 12.3691C14.0956 12.7618 14.073 13.3409 13.707 13.707C13.3409 14.073 12.7618 14.0956 12.3691 13.7753L12.2929 13.707L6.99992 8.41399L1.70695 13.707C1.31645 14.0975 0.683421 14.0974 0.292892 13.707C-0.0976314 13.3164 -0.0976302 12.6834 0.292892 12.2929L5.58586 6.99992L0.292892 1.70696L0.224533 1.63078C-0.0958172 1.23801 -0.0732235 0.659009 0.292892 0.292893C0.659008 -0.0732225 1.23801 -0.0958163 1.63078 0.224534L1.70695 0.292893L6.99992 5.58586L12.2929 0.292893Z"
            fill="var(--fill-0, #121212)"
            id="Original"
          />
        </svg>
      </div>
    </div>
  );
}

function LineWodeshengou() {
  return (
    <div className="relative size-full" data-name="line_wodeshengou" data-node-id="4355:141375">
      <div className="absolute inset-[11.67%_13.2%_13.25%_12.5%]" data-name="Union" data-node-id="4355:141382">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 19">
          <path
            d="M15.6982 10.1592C16.0669 10.0661 16.4464 10.264 16.582 10.6191L17.7832 13.7646C17.931 14.1516 17.7376 14.5857 17.3506 14.7334C16.9636 14.8811 16.5306 14.6868 16.3828 14.2998L15.7773 12.7158L13.79 16.5596L13.7891 16.5605C13.0993 17.8874 11.4645 18.4037 10.1377 17.7139C9.77046 17.5228 9.62758 17.0705 9.81836 16.7031C10.0094 16.3356 10.4626 16.1917 10.8301 16.3828C11.4215 16.6902 12.15 16.4601 12.458 15.8691L14.4482 12.0215L12.7998 12.4375C12.3983 12.5387 11.991 12.2951 11.8896 11.8936C11.7885 11.4922 12.0313 11.0849 12.4326 10.9834L15.6982 10.1592ZM12.75 0C14.8211 0 16.5 1.67893 16.5 3.75V7C16.5 7.41421 16.1642 7.75 15.75 7.75C15.3358 7.75 15 7.41421 15 7V3.75C15 2.50736 13.9926 1.5 12.75 1.5H3.75C2.50736 1.5 1.5 2.50736 1.5 3.75V14.25C1.5 15.4926 2.50736 16.5 3.75 16.5H6.2793C6.69343 16.5001 7.0293 16.8358 7.0293 17.25C7.0293 17.6642 6.69343 17.9999 6.2793 18H3.75C1.67893 18 0 16.3211 0 14.25V3.75C0 1.67893 1.67893 0 3.75 0H12.75ZM6.75 7.92676C7.16421 7.92676 7.5 8.26254 7.5 8.67676C7.49974 9.09075 7.16405 9.42676 6.75 9.42676H3.75C3.33595 9.42676 3.00026 9.09075 3 8.67676C3 8.26254 3.33579 7.92676 3.75 7.92676H6.75ZM10.125 4.125C10.5392 4.125 10.875 4.46079 10.875 4.875C10.875 5.28921 10.5392 5.625 10.125 5.625H3.96289C3.54868 5.625 3.21289 5.28921 3.21289 4.875C3.21289 4.46079 3.54868 4.125 3.96289 4.125H10.125Z"
            fill="var(--fill-0, #121212)"
            id="Union"
          />
        </svg>
      </div>
    </div>
  );
}

function LineHeyuediaoyongjiaoyi() {
  return (
    <div className="relative size-full" data-name="line_heyuediaoyongjiaoyi" data-node-id="4293:137185">
      <div className="absolute inset-[11.67%_12.5%_13.19%_12.5%]" data-name="Union" data-node-id="4293:137192">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 19">
          <path
            d="M10.9648 11.7539C11.2386 11.4435 11.7118 11.414 12.0225 11.6875C12.3333 11.9613 12.3636 12.4353 12.0898 12.7461L10.9668 14.0215L15.2979 14.0107C15.9643 14.0073 16.5028 13.4644 16.5 12.7979C16.4981 12.3838 16.8321 12.0461 17.2461 12.0439C17.6603 12.0421 17.9981 12.3768 18 12.791C18.0066 14.2862 16.7999 15.5039 15.3047 15.5107H15.3027L10.9766 15.5215L12.1084 16.7832C12.385 17.0915 12.359 17.5652 12.0508 17.8418C11.7426 18.1183 11.2688 18.0932 10.9922 17.7852L8.74316 15.2783C8.48928 14.9953 8.48699 14.5666 8.73828 14.2812L10.9648 11.7539ZM12.75 0C14.8211 0 16.5 1.67893 16.5 3.75V8C16.5 8.41421 16.1642 8.75 15.75 8.75C15.3358 8.75 15 8.41421 15 8V3.75C15 2.50736 13.9926 1.5 12.75 1.5H3.75C2.50736 1.5 1.5 2.50736 1.5 3.75V14.25C1.5 15.4926 2.50736 16.5 3.75 16.5H6.2793C6.69343 16.5001 7.0293 16.8358 7.0293 17.25C7.0293 17.6642 6.69343 17.9999 6.2793 18H3.75C1.67893 18 0 16.3211 0 14.25V3.75C0 1.67893 1.67893 0 3.75 0H12.75ZM6.75 7.92676C7.16421 7.92676 7.5 8.26254 7.5 8.67676C7.49974 9.09075 7.16405 9.42676 6.75 9.42676H3.75C3.33595 9.42676 3.00026 9.09075 3 8.67676C3 8.26254 3.33579 7.92676 3.75 7.92676H6.75ZM10.125 4.125C10.5392 4.125 10.875 4.46079 10.875 4.875C10.875 5.28921 10.5392 5.625 10.125 5.625H3.96289C3.54868 5.625 3.21289 5.28921 3.21289 4.875C3.21289 4.46079 3.54868 4.125 3.96289 4.125H10.125Z"
            fill="var(--fill-0, #121212)"
            id="Union"
          />
        </svg>
      </div>
    </div>
  );
}

export default function Component() {
  return (
    <div
      className="bg-[#ffffff] overflow-clip relative rounded-2xl shadow-[0px_0px_0.5px_0px_rgba(0,0,0,0.08),0px_12px_32px_0px_rgba(0,0,0,0.03),0px_6px_16px_0px_rgba(0,0,0,0.05)] size-full"
      data-name="侧浮层"
      data-node-id="2372:99453"
    >
      <div className="absolute h-[50px] left-0 top-5 w-[1248px]" data-node-id="2372:99464">
        <div
          className="absolute box-border content-stretch flex h-[30px] items-center justify-between left-6 p-0 top-0 w-[1200px]"
          data-node-id="2372:99465"
        >
          <div
            className="box-border content-stretch flex gap-4 items-center justify-start p-0 relative shrink-0"
            data-node-id="2372:99466"
          >
            <div
              className="box-border content-stretch flex gap-2 items-center justify-start p-0 relative shrink-0"
              data-node-id="2372:99467"
            >
              <div
                className="font-['MiSans:Semibold',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#121212] text-[20px] text-nowrap"
                data-node-id="2372:99468"
              >
                <p className="block leading-[30px] whitespace-pre">易付惠详情</p>
              </div>
            </div>
          </div>
          <div className="relative shrink-0 size-6" data-name="line_close&errorLight-2px" data-node-id="2372:99469">
            <LineCloseErrorLight2Px />
          </div>
        </div>
        <div className="absolute h-0 left-0 top-[50px] w-[1248px]" data-node-id="2372:99470">
          <div
            className="absolute bottom-0 left-0 right-0 top-[-1px]"
            style={{ "--stroke-0": "rgba(0, 0, 0, 0.05)" } as React.CSSProperties}
          >
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1248 1">
              <line id="Line 160" stroke="var(--stroke-0, black)" strokeOpacity="0.05" x2="1248" y1="0.5" y2="0.5" />
            </svg>
          </div>
        </div>
      </div>
      <div
        className="absolute box-border content-stretch flex flex-col gap-6 items-start justify-start left-6 p-0 top-[94px] w-[1200px]"
        data-node-id="2372:99471"
      >
        <div
          className="box-border content-stretch flex flex-col gap-4 items-start justify-center p-0 relative shrink-0 w-full"
          data-node-id="2372:99472"
        >
          <div
            className="box-border content-stretch flex gap-4 items-center justify-start p-0 relative shrink-0"
            data-node-id="2372:99473"
          >
            <div
              className="overflow-clip relative shrink-0 size-[60px]"
              data-name="circlefilled_success"
              data-node-id="2372:99474"
... additional lines truncated ...
            </div>
            <div
              className="box-border content-stretch flex flex-col gap-6 items-start justify-start p-0 relative shrink-0 w-full"
              data-node-id="2372:99548"
            >
              <div
                className="box-border content-stretch flex gap-4 items-start justify-start p-0 relative shrink-0 w-full"
                data-node-id="2372:99549"
              >
                <div
                  className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start leading-[0] min-h-px min-w-px not-italic p-0 relative shrink-0 text-[14px] text-nowrap"
                  data-node-id="2372:99550"
                >
                  <div
                    className="font-['MiSans:Regular',_sans-serif] relative shrink-0 text-[rgba(18,18,18,0.5)]"
                    data-node-id="2372:99551"
                  >
                    <p className="block leading-[22px] text-nowrap whitespace-pre">收款方名称</p>
                  </div>
                  <div
                    className="font-['MiSans:Medium',_sans-serif] relative shrink-0 text-[#121212]"
                    data-node-id="2372:99552"
                  >
                    <p className="block leading-[22px] text-nowrap whitespace-pre">王老板</p>
                  </div>
                </div>
                <div
                  className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start leading-[0] min-h-px min-w-px not-italic p-0 relative shrink-0 text-[14px] text-nowrap"
                  data-node-id="2372:99556"
                >
                  <div
                    className="font-['MiSans:Regular',_sans-serif] relative shrink-0 text-[rgba(18,18,18,0.5)]"
                    data-node-id="2372:99557"
                  >
                    <p className="block leading-[22px] text-nowrap whitespace-pre">银行名称</p>
                  </div>
                  <div
                    className="font-['MiSans:Medium',_sans-serif] relative shrink-0 text-[#121212]"
                    data-node-id="2372:99558"
                  >
                    <p className="block leading-[22px] text-nowrap whitespace-pre">The Currency Cloud Limited</p>
                  </div>
                </div>
                <div
                  className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start leading-[0] min-h-px min-w-px not-italic p-0 relative shrink-0 text-[14px] text-nowrap"
                  data-node-id="2372:99603"
                >
                  <div
                    className="font-['MiSans:Regular',_sans-serif] relative shrink-0 text-[rgba(18,18,18,0.5)]"
                    data-node-id="2372:99604"
                  >
                    <p className="block leading-[22px] text-nowrap whitespace-pre">收款账户</p>
                  </div>
                  <div
                    className="font-['MiSans:Medium',_sans-serif] relative shrink-0 text-[#121212]"
                    data-node-id="2372:99605"
                  >
                    <p className="block leading-[22px] text-nowrap whitespace-pre">GB44TCCL12345681960351</p>
                  </div>
                </div>
              </div>
              <div
                className="box-border content-stretch flex gap-4 items-start justify-start p-0 relative shrink-0 w-full"
                data-node-id="2372:99559"
              >
                <div
                  className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start leading-[0] min-h-px min-w-px not-italic p-0 relative shrink-0 text-[14px] text-nowrap"
                  data-node-id="2372:99563"
                >
                  <div
                    className="font-['MiSans:Regular',_sans-serif] relative shrink-0 text-[rgba(18,18,18,0.5)]"
                    data-node-id="2372:99564"
                  >
                    <p className="block leading-[22px] text-nowrap whitespace-pre">账户所在地</p>
                  </div>
                  <div
                    className="font-['MiSans:Medium',_sans-serif] relative shrink-0 text-[#121212]"
                    data-node-id="2372:99565"
                  >
                    <p className="block leading-[22px] text-nowrap whitespace-pre">英国</p>
                  </div>
                </div>
                <div
                  className="basis-0 box-border content-stretch flex flex-col gap-2 grow items-start justify-start leading-[0] min-h-px min-w-px not-italic opacity-0 p-0 relative shrink-0 text-[14px] text-nowrap"
                  data-node-id="2372:99566"
                >
                  <div
                    className="font-['MiSans:Regular',_sans-serif] relative shrink-0 text-[rgba(18,18,18,0.5)]"
                    data-node-id="2372:99567"
                  >
                    <p className="block leading-[22px] text-nowrap whitespace-pre">账户所在地</p>
                  </div>
                  <div
                    className="font-['MiSans:Medium',_sans-serif] relative shrink-0 text-[#121212]"
                    data-node-id="2372:99568"
                  >
                    <p className="block leading-[22px] text-nowrap whitespace-pre">英国</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  - 建立约定： 为了解决这个问题，与 UX 同学协商：将 Figma 中的组件命名与我们内部组件库（如 ptpButton）的名称保持一致。
  - 自建 MCP 中间层： 再次抓取 MCP 数据后，我们发现 Figma 的组件名会体现在每个 DOM 节点的 data-name 属性上。于是，我起了一个自己的 MCP 服务作为“中间转换层”。
    - Cursor 调用我们的自定义 MCP 服务。
    - 我们的服务去请求官方 Figma MCP，获取原始的 div 代码。
    - 服务内部对代码进行解析和增强：如果一个 div 的 data-name 是以我们约定的 ptp 开头，就在这个 div 上添加一个 component="ptpButton" 的属性。
    - 最后，将处理后的代码返回给 Cursor。
- 流程变化：
  - 以前： 截图 -> 发给 AI。
  - 现在： 复制 Figma 链接 -> 发给 AI。
- 个人体验： 针对一些小的模块效果还是比较明显的。因为 AI 能直接读到设计文件里的图层信息、样式变量，它生成的代码在还原度上高了很多，后期微调的工作量确实减少了。
- 存在的问题与下一步规划：
这个方案解决了一大痛点，但我们很快又发现了新的问题：AI 知道这是一个 ptpButton，但它不知道这是个什么状态的按钮（例如 primary、secondary 或 disabled）。这些状态信息隐藏在 className 的样式（如 bg-[#ffcd29]）中，MCP 并没有直接提供。
- 我的下一步想法是，在我们的中间层服务中创建一个“样式到属性的映射表”。
  - 原理： 服务在解析 div 时，不仅检查 data-name，还会检查它的 className。
  - 映射规则： 我们可以定义一套规则，例如：如果一个 data-name="ptpButton" 的节点，它的 className 包含了 bg-[#ffcd29]，我们就知道它应该是一个 type="primary" 的按钮。
暂时无法在飞书文档外展示此内容
暂时无法在飞书文档外展示此内容
尝试二：连接 Swagger —— 减少接口对接的重复劳动
- 怎么做的： 基于我们的 Swagger 文档，尝试实现了一个简单的 MCP 服务，让它能被 Cursor 访问。
- 流程变化：
  - 以前： 手动复制一堆接口信息。
  - 现在： 复制 Swagger 文档的链接 -> 发给 AI。
- 个人体验： 这个改动带来的幸福感很强。AI 可以自己去链接里读取所有接口定义，然后帮我们生成好 TypeScript 类型、请求函数等。这不仅省去了大量重复劳动，也因为数据来源是统一的，有效避免了手动复制可能犯的低级错误。
暂时无法在飞书文档外展示此内容
示例
三：构建全链路 AI 辅助工作流
上面两个实践已经证明了“上下文直连”模式的潜力。但这仅仅是一个开始，我认为未来还有两个关键方向值得我们投入探索：
1. PRD MCP (飞书文档链接)
这是一个将 AI 辅助开发从“代码实现”层面提升到“业务理解”层面的关键一步。
- 解决的痛点：
  - 上下文缺失：开发者在写代码时，心中需要有完整的业务蓝图。手动向 AI 描述这些业务逻辑，既耗时又容易遗漏关键细节和边界条件。
  - 需求理解偏差：即使复制了部分 PRD 内容，AI 也可能因为缺乏完整的上下文而误解需求。
  - 任务拆解困难：一个复杂的 PRD 需要开发者手动拆解成多个开发任务。
- MCP 方式的优势：
  - 赋予 AI 业务理解能力：通过直接读取飞书（或其他平台）的 PRD 文档，AI 可以完整地理解一个功能的前因后果、业务目标、用户故事、验收标准和逻辑流程图。
  - 自动化任务拆解：AI 可以基于 PRD 内容，主动建议技术方案、拆分开发任务等。
  - 成为“随时在线的产品经理”：开发者在编码过程中，可以直接向 AI 提问关于 PRD 的细节（例如，“当用户账户余额不足时，应该显示什么提示？”），AI 可以快速在文档中定位并给出准确答案。
这实际上是让 AI 承担了一部分初级产品经理和项目经理的职责，极大地解放了开发者的心智负担，使其能更专注于高质量的技术实现。
2. 提示词优化工具
这是一个非常巧妙的“元工具”，它解决了人与 AI 之间最核心的“沟通”问题。
- 解决的痛点：
  - “我说不清楚，AI 猜不明白”：很多时候，开发者脑海里有一个模糊的想法，但用自然语言描述出来时可能存在歧义或信息缺失，导致 AI 生成的结果南辕北辙。
  - Prompt 工程的学习成本：要写出让 AI 高效工作的提示词本身就是一种技能。该工具降低了这个门槛。
  - 无效的反复沟通：因为第一次没说清而导致多次修改和重试，浪费了大量时间。
- 这个工具的价值：
  - 意图澄清：在正式执行前，工具通过重组和优化的方式，向用户“复述”一遍它理解的任务。这个“复述”过程本身就是一个极佳的确认环节，确保人与 AI 在“同一个频道上”。
  - 提升 AI 输出质量：经过优化的提示词结构更清晰、信息更完备，能引导 AI 产出更精确、更符合期望的代码。例如，它可能会自动帮你补充“请使用 TypeScript”、“遵循 aribnb 编码规范”、“为组件生成对应的单元测试”等关键约束。
  - 用户赋能：通过观察优化前后的对比，用户能潜移默化地学会如何写出更好的提示词，这是一个非常好的教学过程。
在公司信息当前内容的前面部分加入新的内容：证件待更新、会员基本信息。https://www.figma.com/design/qHjumM6LKmLusYCQs8Jnf9/PHP-V3-%E9%A6%96%E9%A1%B5%E4%B8%80%E6%9C%9F%E7%AE%80%E5%8C%96%E7%89%88?node-id=2008-53059&m=dev此 figma 链接中的内容为此次需要新增的内容，请你根据 figma 信息 1比 1 还原，目前还没有后端接口，使用 mock 数据，和 figma 中的数据保持一致，更具 figma 节点信息的data-name使用对应的内部封装组件（src/components）

请在公司信息页面（CompanySettings/index.vue）的当前内容前面添加两个新的模块：
1. 证件待更新模块
2. 会员基本信息模块

具体要求：
1. **设计参考**：严格按照 Figma 设计稿进行 1:1 还原
   - Figma 链接：https://www.figma.com/design/qHjumM6LKmLusYCQs8Jnf9/PHP-V3-%E9%A6%96%E9%A1%B5%E4%B8%80%E6%9C%9F%E7%AE%80%E5%8C%96%E7%89%88?node-id=2008-53059&m=dev
   - 节点ID：2008-53059

2. **组件使用**：
   - 根据 Figma 节点信息中的 data-name 属性，使用对应的内部封装组件（位于 src/components 目录）
   - 在使用组件前，先查看项目中其他文件的组件使用示例，确保用法一致
   - 保持与现有代码的样式和结构风格一致

3. **数据处理**：
   - 由于后端接口尚未完成，使用 mock 数据
   - mock 数据内容需与 Figma 设计稿中显示的数据保持一致

4. **布局位置**：
   - 将新增的两个模块放置在公司信息页面现有内容的最前面
   - 确保新模块与现有内容的间距和布局协调

请先分析 Figma 设计稿内容，然后查看现有的 CompanySettings 组件结构，最后实现新增功能。
四、如果这一切都实现了，我们的工作会变成什么样
前面我分享了两个初步的探索时间，和两个还在规划中的想法。大家可能会想，把这四件事都做完，到底能给我们带来多大的改变？
我想，这不仅仅是“快了一点点”那么简单。它将从根本上重塑我们的开发工作流，带来几个层面的显著提升：
1. 开发效率的提升
- 现状： 我们的大量时间消耗在信息的“搬运”和“转译”上：看懂 PRD，理解 UI，复制接口，然后把这些信息“翻译”成代码。
- 未来： 整个流程将变得自动化。当一个需求下来，我们的工作起点不再是一个空白的文档，而是：
  - AI 读完 PRD，已经帮我们生成了基础的代码框架和任务列表。
  - AI 读完 Figma 链接，已经生成了高保真的、符合设计规范的静态页面。
  - AI 读完 Swagger 链接，已经完成了所有的数据类型定义和接口请求函数。
  - 我们只需在 AI 生成的 80% 的高质量基础上，专注于实现那 20% 最核心、最复杂的业务逻辑。
开发场景对比
需求理解与任务分解（2天）
需求理解与任务分解（1 天）
在传统开发流程中，开发者需要阅读上千字的 PRD，从中提取功能模块（如用户列表、用户详情、权限管理）、业务流程（注册 → 审核 → 激活 → 使用）和数据模型（用户表、角色表、权限表）。由于信息量大，人工整理容易遗漏关键功能点，如批量操作、数据导出、操作日志等。 
在技术方案设计阶段，开发者还需手动编写技术任务清单、估算工作量并制定开发计划。缺乏系统化分析工具时，容易导致估算偏差和计划不合理。
在 AI/MCP 优化后的流程中，需求理解阶段效率显著提升。开发者只需提供飞书 PRD 链接，PRD MCP 即可让 Cursor 自动读取文档并提取关键信息，包括功能模块、业务流程和数据模型，减少了大量手动整理工作。 
在任务规划阶段，开发者可基于 MCP 提供的文档内容，借助 AI 辅助快速识别隐含技术要求（如权限控制、安全、性能等），并生成初步技术任务清单。

设计稿转代码（3 天）
设计稿转代码（1.5-2 天）
设计稿转代码阶段是典型的重复性工作密集环节。开发者需要手动测量组件尺寸、间距、颜色，识别组件类型（表格、表单、按钮等），并编写样式代码。重复操作容易导致测量误差和样式不一致。 
在组件开发阶段，创建 Vue 组件、编写样式与交互逻辑、处理响应式和兼容性问题都需从零开始，缺乏标准化模板，导致效率低且代码质量不稳定。
在 设计稿转代码阶段，通过 Figma MCP 实现了自动化处理。系统可自动提取设计稿信息，识别组件类型和层级关系，并生成组件映射表。AI 基于这些信息自动生成 Vue 组件代码，应用项目样式规范，生成响应式布局，并处理组件引用和依赖。
 整个流程大幅减少了手动测量与样式编写，提高了代码一致性与可维护性，开发者只需对生成代码进行微调，而无需从零编写。
接口对接（2天）
接口对接（1 天）
接口对接阶段涉及大量手动文档分析与代码编写。开发者需要阅读 Swagger 文档，理解请求参数、响应格式和错误码，并手动编写 TypeScript 类型、API 请求函数，处理错误与 loading 状态。容易出现类型不准确或错误处理不完善的问题。 在数据联调阶段，开发者需与后端多次沟通解决数据格式或接口调用错误，往返耗时长，且容易出现理解偏差。
在 接口对接阶段，通过 Swagger MCP 实现了文档读取自动化。开发者只需提供 Swagger 文档链接，MCP 即可让 Cursor 自动提取接口请求参数、响应格式和错误码，减少手动整理工作量。 
基于 MCP 提供的接口信息，AI 辅助可快速生成 TypeScript 类型定义、API 请求函数，并处理错误与 loading 状态。支持 Mock 数据生成与一键切换真实接口，自动处理数据格式转换，大幅提升开发效率和接口对接准确性。
业务逻辑开发（5 天）
业务逻辑开发（3-4 天）
业务逻辑开发阶段是整个流程中最复杂的环节。开发者需从零编写用户列表展示、搜索、筛选、分页，以及用户详情和权限管理等功能，缺乏可复用组件和模板。 在测试与优化阶段，需要进行功能测试、Bug 修复、性能优化和代码重构，多次迭代耗时长，且容易遗漏问题。
在 业务逻辑开发阶段，通过 提示词优化 MCP 实现了规则化辅助。MCP 为 Cursor 提供标准化提示词模板和润色规则，当开发者输入原始提示词时，Cursor 可进行上下文补全和优化，生成高质量提示词，用于生成符合项目规范的业务逻辑代码。 
AI 可基于优化后的提示词自动生成用户管理核心功能，包括搜索、筛选、分页及权限控制逻辑，并自动处理异常。在代码优化阶段，AI 还能辅助代码重构、生成单元测试，并提供性能优化建议。
2. 代码质量与一致性的保障
- 现状： 代码质量依赖于每个开发者的经验和责任心。设计规范和接口约定，需要靠人来记忆和遵守，难免出现偏差。
- 未来： 代码将直接从“单一事实来源”生成。
  - UI 还原不再有“差不多就行”，而是与 Figma 设计稿像素级的精准匹配。
  - 所有代码都将默认使用设计系统中的 Design Tokens（颜色、字体等变量），而不是硬编码。
  - 前后端联调的低级错误（如字段名写错、数据类型不匹配）将大大减少，因为 TS 类型直接源于后端接口定义。
  - “遵守规范”不再需要刻意为之，它变成了自动化流程的必然结果。
3. 开发者体验的优化，回归创造，而非“搬运”
- 现状： 我们时常会感觉自己被困在重复、琐碎的任务中，创造力无法得到充分发挥。
- 未来： 当 AI 接管了那些最消耗精力但价值密度低的环节后，我们可以把宝贵的时间和脑力，投入到真正有挑战和价值的工作中去：
  - 思考更优的软件架构。
  - 打磨更极致的用户体验。
  - 探索和学习新的技术。
- 这将提升我们的工作满意度和成就感。我们不再是信息的“搬运工”，而是真正的“创造者”和“问题解决者”。
五、主流 AI 工具选型与体验对比
分享一下我对目前主流的两款工具Cursor 和 Augment 在接入了 Figma 和 Swagger 的 MCP 后一些个人使用感受。
工具
Cursor
Augment

优点 
1. UI 还原较好。
2. 成本较低： 20$/月。
1. 综合能力强： 长任务处理、项目级理解和自动提示词优化是其核心优势。

缺点 
1. 长任务能力弱： 处理复杂需求时易“遗忘”上下文，需要人工拆解任务。
2. 依赖使用者： 对使用者的 Prompt 提问技巧要求较高。
1. UI 还原度待提升： 目前在设计稿还原的精准性上，不如 Cursor。
2. 成本稍高： 30 50$/月。

40$/
六、后续工作
Figma MCP：与 UE团队的协作要点
在 Figma MCP 探索中，我们发现要想让 AI 输出更符合项目实际，技术上的努力是必要的，但更重要的是需要与 UE 团队建立共识，并共同维护一套标准。我们之前提到的“样式映射表”方案，其健壮性就高度依赖于这套标准。Figma MCP 优化：
1. 组件命名标准化 → Figma 组件名与代码库组件名需建立映射。
2. Figma code connect研究 → https://www.figma.com/code-connect-docs/
3. Icon 命名统一 → 设计稿与项目 icon 库对不上，需规范化命名与导出。
4. Design Token 对齐 → 颜色、字体、间距需要在设计与代码层面一一对应。
5. 交互标注 → 需在设计稿中提供交互说明。
https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Dev-Mode-MCP-Server
