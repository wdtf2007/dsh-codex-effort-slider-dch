# dsh-codex-effort-slider-dch

为 DeepSeek Harness（DSH Desktop）提供 Codex 订阅模型兼容的推理强度动画滑块。

## 来源与致谢

本项目在 **[Microqian2th](https://github.com/Microqian2th)** 的 **[dsh-codex-effort-slider](https://github.com/Microqian2th/dsh-codex-effort-slider)** 项目上扩展，并非从零实现，也不是原作者的官方发布。

- 原项目仓库：<https://github.com/Microqian2th/dsh-codex-effort-slider>
- 扩展基线：上游 1.1.2，提交 `d1bb67b20bc19d44be7d7694ffca92a6f2fcbe9b`。
- 原滑块、动画组件、样式、模型目录处理和主要测试来自原项目及其贡献者。
- 保留原始 [MIT 许可证与版权声明](LICENSE)，原项目说明见 [README.upstream.md](README.upstream.md)。

**本扩展适配的插件是 [WSL043 / dsh-codex-subscription](https://github.com/WSL043/dsh-codex-subscription)**：

<https://github.com/WSL043/dsh-codex-subscription>

该订阅插件负责将 ChatGPT/Codex 订阅模型接入 DSH；本项目负责在其模型菜单中整合动画滑块与真实速度按钮。认证、模型请求和订阅额度功能仍由订阅插件提供。

## 扩展功能

- 兼容订阅插件包含模型、推理等级、速度、输出详略的菜单结构。
- 直接读取模型目录提供的真实推理档位，通过 DSH 现有接口更新等级，不伪造档位或模型能力。
- GPT/Codex 普通档位为蓝色；目录实际提供的 `max` / `ultra` 档使用蓝紫粉渐变与星尘。
- 粒子仅出现在滑块左侧已点亮区域，右侧空轨道不绘制粒子。
- 最高档普通速度下，颗粒均匀散布、轻缓悬浮；高速模式下，各推理档位均有与强度对应的流动效果。
- 高速开启和关闭沿同一粒子运动相位平滑加减速，避免跳位和重新排列。
- 小闪电直接切换订阅插件的真实速度状态；速度与推理等级相互独立。只读、不支持或保存中时禁用切换，失败时保留真实状态。
- 恢复按钮使用真实目录默认档位，或清除显式推理档位以恢复提供方默认。
- 保留 DSH 浅色背景及原菜单结构，不强制修改主题；DeepSeek 使用原有界面和动画逻辑。

## 兼容范围

已在 DSH Desktop **0.2.1-rc.3**、`dsh-codex-subscription` **3.1.6** 环境验证。模型实际档位和高速能力取决于订阅插件及其目录，本项目不增加账号权限或额度。

插件内的包名和注册标识保留为 `dsh-codex-effort-slider`，以沿用既有 DSH 加载方式。**不要与原项目同时启用**。

## 安装

1. 保存当前工作，正常退出 DSH，并备份原滑块的插件来源和配置。
2. 下载本仓库源码，解压到长期保留的独立目录。目录内应直接有 `package.json`、`lib/` 和 `cordis.patch.yml`。
3. 在 DSH 插件管理中，将原滑块的来源改为该本地目录；若需先卸载同名滑块，再添加本地目录，请保留原安装备份。不要卸载订阅插件。
4. 正常重启 DSH，在原模型菜单内使用滑块和速度按钮。

也可在 Windows 中构建安装目录包：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./pack-personal.ps1
```

产物位于 `dist/`。ZIP 是可安装目录内容，解压后添加该目录，并非双击安装器。仓库中的 `install.cmd` / `install-profile.ps1` 为上游历史脚本，常规安装请使用上述方式。

## 测试

需要 Node.js >=22；插件运行时零第三方依赖。

```powershell
npm test
node --check lib/client.js
```

没有 npm 时可分别运行：

```powershell
node test/client.test.mjs
node test/subscription.test.mjs
node test/gpt-speed.test.mjs
node test/codex-motion.test.mjs
node test/deepseek-unchanged.test.mjs
```

测试包括原项目 449 项断言、订阅兼容、真实速度控制器交互、粒子连续运动，以及 DeepSeek 四档与先前基准的 DOM、样式和动画参数精确对比。测试宿主不发送模型消息。

可选浏览器夹具 `test/browser-check.cjs` 需要另行准备 Playwright、浏览器和 React 18 UMD 文件，通过 `PLAYWRIGHT_MODULE`、`CHROME_PATH`、`BROWSER_VENDOR` 指定位置；这些不是运行依赖。`preview/` 和原项目截图展示上游效果，不作为本扩展的实机验收截图。

## 卸载与回退

通过 DSH 插件管理卸载本扩展，再从保存的来源或备份恢复原滑块，正常重启 DSH。不要覆盖整个 DSH 配置或卸载订阅插件。

## 限制

- 真实模型请求响应、计费和额度消耗未纳入本项目验收，未发送测试消息。
- 订阅插件若更改菜单或公开插槽结构，需要重新核对兼容性；无法识别时尽量保留原生界面。
- 原生客户端视频仅作为动画视觉参考，并非对其动画源码或模型能力的复制。

详细实现与验证记录见 [PERSONAL-NOTES.md](PERSONAL-NOTES.md)、[GPT-SPEED-UPDATE.md](GPT-SPEED-UPDATE.md) 和 [TEST-REPORT.md](TEST-REPORT.md)。
