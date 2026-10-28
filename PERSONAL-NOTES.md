# 来源与兼容性记录

此包是在 Microqian2th 的 dsh-codex-effort-slider 基础上制作的个人扩展，不代表原作者发布。
适配插件：WSL043/dsh-codex-subscription，仓库 https://github.com/WSL043/dsh-codex-subscription 。
当前 personal.3 的一键速度开关和连续粒子运动见 GPT-SPEED-UPDATE.md；下文 personal.2 速度装饰说明仅为历史记录。
上游：https://github.com/Microqian2th/dsh-codex-effort-slider
基线提交：d1bb67b（完整 SHA 见交付报告）；版本 1.1.2。
保留原 MIT LICENSE。README.upstream.md 为原说明。原滑块、动画、粒子、
设置、目录接入及测试主要由上游贡献者实现，个人版仅增加兼容修改。

本地核对：DSH Desktop 0.2.1-rc.3；Electron 44.7.0；原滑块 1.1.2；订阅插件 3.1.6。
公开订阅仓库调查时为 3.1.7，关键菜单结构另与本地 3.1.6 核对一致。
没有读取账号、Cookie、认证令牌、聊天记录或认证存储。

根因：原 findEffortRow 在识别标签之前，要求 menuitem 数量恰为 2。
订阅插件 CodexModelSelect 会按模型能力加入 speed / verbosity 根菜单项，
因此已有真实 reasoning.efforts 时也被该检查拒绝。不是 DeepSeek provider 白名单。

个人修改：
* 识别有标签的多行菜单；只有原两行结构保留位置回退，未知多行菜单保持原生。
* 原目录读取与 directory.select 写回保留，不自行请求或映射模型能力。
* Codex 缺失实时档位或当前有效档位不在目录时保留原生菜单。
* Codex 普通档位蓝色；实际 id 为 max / ultra 时启用原星尘层和蓝紫粉渐变。
  不把 xhigh / high 改名为 Ultra，不增加目录里没有的档位。
* 闪电装饰既有 subscription 速度行，读取“标准/高速/极速 Beta”或英文值。
  不增加点击处理、不调用私有偏好 RPC；该行仍由订阅插件打开原生速度选择页。
  所以它不是单击开关，是否可写和具体速度列表仍由订阅插件判断。
  未知速度文案不显示图标；订阅插件改 DOM/文案时需要重新核对。
* 目录有合法 defaultEffort 时，恢复图标通过原 select 选择该 ID。
  目录未给 defaultEffort 而原生菜单提供“默认”时，把该真实原生选项作为独立刻度。
  恢复时仅传 provider/model，不传 reasoningEffort，和原生操作完全一致。
  内部 UI 标识从不发送给模型；不将“默认”推断为任何明确等级。
* 限制旧模型/会话排队请求、忽略过期回包，清理设置事件和速度装饰。

验收边界：449 项上游断言、新增兼容回归、隔离 Chrome + 真 React 的交互已测。
用户确认后已安装 personal.2 并完成实机模型菜单、推理档位写回、原生速度切换、
默认恢复、Codex/DeepSeek 模型切换验证。实机截图文件名为 dsh-live-*。
浏览器夹具截图仍保留其隔离测试标记。实际模型调用验收状态以最新交付报告为准。
没有可用公开接口来取消已发送给宿主的 select；本版阻止后续串写并忽略过期结果，
已发请求最终怎样与并发模型切换排序由 DSH 自身保证。

上游预览页仅展示原滑块效果，不作为本版 Codex 行为或真实账号能力证明。
