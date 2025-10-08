---
title: ACT Made Simple — RAG Knowledge Cards (原创总结)
version: 2025-10-03
source_inspiration: Russ Harris & ACT literature (public handouts, workshops)
license_note: 本文件为原创总结与示例对话，允许用于模型检索与训练的“参考语料”（非逐字复制书籍内容）。
tags: [ACT, 接纳承诺疗法, 心理灵活性, 价值澄清, 认知解离, 当下觉察, 自我即情境, 承诺行动, choice point, FEAR, DARE, dropping anchor]
chunking_hint: 每张卡 ≤ 220 词；可按“---”进行切块向量化。
---

# CARD:overview/act_goal
id: overview/act_goal
keywords: [心理灵活性, suffering, experiential avoidance, workability]
summary: ACT 的目标是提升“心理灵活性”：在当下保持开放与觉察，并在价值指引下采取有效行动；不是消灭痛苦，而是改变我们与内在体验的关系与行动选择（可用“是否有助于过有意义生活”的可行性/工作性检视）。citeturn0search2turn1search11
retrieval_points:
- 痛苦常由“认知融合+体验回避”维持；评估行为“长期是否有效/有益”。
- 两股能力：对经验开放 & 行动受价值引导。citeturn1search11

---

# CARD:model/hexaflex
id: model/hexaflex
keywords: [六核心过程, acceptance, defusion, present, self-as-context, values, committed action]
summary: 六核心过程：接纳（make room）、解离（与想法拉开距离）、接触当下（扎根）、自我即情境（观察者视角）、价值（重要方向）、承诺行动（价值引导的可执行步）。这些过程共同促进心理灵活性。citeturn0search11turn0search5
retrieval_points:
- 六过程彼此联动，非线性；可从任一过程入手。
- 常配以“hexaflex”图解用于解释与制定干预。citeturn0search2

---

# CARD:logic/workability_creative_hopelessness
id: logic/workability_creative_hopelessness
keywords: [creative hopelessness, 工作性, 控制议程, 痛苦]
summary: “创造性无望/工作性”对话：检视来访者长期使用的“控制痛苦”策略是否有效、代价如何；当控制议程在该情境下“不工作”，转向接纳与价值导向行动。citeturn0search9
therapist_prompts:
- “你为摆脱痛苦做过哪些事？短期/长期分别怎样？代价是什么？”citeturn0search9
- “我们试试不同路径：与体验并存，同时做对你重要的事。”

---

# CARD:tool/choice_point
id: tool/choice_point
keywords: [choice point, toward/away moves, STOP 提示]
summary: Choice Point 帮助识别“朝向价值的行为（toward）”与“远离/回避（away）”；在“选择点”练习先减速、注意、开放，再朝价值行动。citeturn0search3turn0search7
steps:
- 识别触发→注意内外体验→标注“朝向/远离”→选定一个最小“朝向”步。

---

# CARD:tool/fear_dare
id: tool/fear_dare
keywords: [FEAR, DARE, 阻碍与解方]
summary: FEAR：Fusion（融合）、Evaluation（评判）、Avoidance（回避）、Reason-giving（找理由）；DARE：Defusion（解离）、Acceptance（接纳不适）、Realistic goals（可行目标）、Embracing values（拥抱价值）。citeturn0search1turn0search6
usage:
- 逐项匹配障碍→为每项配对 D/A/R/E 的具体策略。

---

# CARD:process/acceptance
id: process/acceptance
keywords: [打开空间, willingness, 扩容]
summary: 接纳=给不适体验留空间，不再把“无痛”当目标。与“逃避→短期舒缓/长期受限”相对。常与价值/行动绑定呈现。citeturn1search11
micro_skills: [呼吸中标注感受, 扩张身体容纳感, 渐进暴露中的接纳语言]

---

# CARD:process/defusion
id: process/defusion
keywords: [解离, hooks, 我正在有这样的念头]
summary: 解离=识别“被钩住”的念头像文字/声音，改变与念头的关系而不是与其争论；语言游戏、给念头贴标签、“我正在有…的念头”。citeturn0search11
exercises: [给念头取标题, 文本上浮/卡通声读念头, 重复词稀释意义]

---

# CARD:process/present_moment
id: process/present_moment
keywords: [接触当下, 觉察, grounding]
summary: 把注意拉回当前（五感/身体/当下任务），降低反刍、担忧，增强与价值一致的可控行动。citeturn0search2
tools: [正念观察, 任务聚焦, 环境点名]

---

# CARD:process/self_as_context
id: process/self_as_context
keywords: [自我即情境, 观察者自我, 去中心化]
summary: 体会“观察者自我”：我不是念头/情绪/角色，而是觉察它们的场域；有助于与痛苦经历共处、减少融合。citeturn1search13
micro_interventions: [观察呼吸中的“我注意到…”, 声音/图像来去练习]

---

# CARD:process/values
id: process/values
keywords: [价值澄清, 方向而非终点, 领域]
summary: 价值=持续方向（如“关爱、学习、公正”），非一次性目标；可按领域（关系/健康/成长/工作/公益）澄清并转化为可见行为。citeturn0search2
tools: [价值卡片排序, 悼文/80岁生日致辞, 角色最佳自我]

---

# CARD:process/committed_action
id: process/committed_action
keywords: [承诺行动, 微步骤, 障碍计划]
summary: 以价值为导向设定“可实现/可观察/有时间窗口”的微行动；提前为 FEAR 障碍配好 DARE 方案。citeturn0search1
templates:
- If-Then 计划：如果X触发FEAR，就执行某项 DARE 技巧与一个最小 toward move。

---

# CARD:tool/dropping_anchor
id: tool/dropping_anchor
keywords: [dropping anchor, ACE]
summary: “抛锚”ACE：Acknowledge（承认内在体验）→ Come back into body（回到身体）→ Engage（投入当前活动）。适合强情绪/解离/闪回等情境的快速稳固练习。citeturn1search0turn1search11
script_stub:
- “注意到里头的东西→双脚用力→说出你在做什么并继续做 10 秒。”

---

# CARD:stance/therapeutic
id: stance/therapeutic
keywords: [同盟, 验证, 行为实验, 体验式]
summary: ACT 咨询师立场：温暖、好奇、体验式、以工作性为准绳；频繁做“当下微练习+行为试验”，把技巧嵌入价值与行动。

---

# CASE:anxiety_choice_point
id: case/anxiety_choice_point
keywords: [广泛性焦虑, toward/away, 抛锚, 解离]
presenting: 32岁产品经理，遇不确定工作情境频繁查邮箱与逃避开会，长期疲惫与自责。
formulation: 触发（不确定邮件/会议）→ 内在体验（心跳、念头“我会搞砸”）→ Away（临时请假、陷入推迟）→ 短舒缓/长期受损；维持因子：融合+回避。
interventions: Choice Point 制图；FEAR→DARE 配对；Dropping Anchor；价值=“专业&合作”。
sample_dialogue:
- T: “此刻脑中最响的句子是什么？”
- C: “我会搞砸。”
- T: “把它放到屏幕上，标题叫《搞砸的故事》。读成卡通声，感受变化？”
- C: “没那么真了。”
- T: “现在双脚踩地，数出你看到的三样东西。好，选一个‘朝向合作’的最小步？”
- C: “把议程发给同事并请他们补充。”
- T: “就是它。记下：若出现《搞砸的故事》，先抛锚，再发议程。”

---

# CASE:panic_drop_anchor
id: case/panic_drop_anchor
keywords: [惊恐, 身体感受恐惧, 暴露, 抛锚ACE]
presenting: 27岁学生地铁易惊恐，回避高峰乘车。
interventions: 教 ACE 抛锚+暴露分级；价值=“独立通学”；If-Then：心跳↑→Acknowledge+脚踩地+说出环境细节→按计划乘1站。
sample_dialogue:
- T: “心跳来了时，我们不跟它打仗，先承认它在。此刻脚下？”
- C: “鞋底很实。”
- T: “看向门上安全图标，读出上面三个词，然后上车一站，车上给自己说：‘我能带着心跳去上课’。”

---

# CASE:depression_activation
id: case/depression_activation
keywords: [抑郁, 行为激活, 价值驱动, 微步骤]
presenting: 41岁来访者长期低落、退缩，白天卧床刷短视频。
interventions: 价值=“关爱家人/创作”；把“起床→洗脸→走到阳台 2 分钟晒太阳”设为最小 toward；为“没力气”念头做解离练习与奖励计划。
sample_dialogue:
- T: “当‘没力气’出现时，我们不争论，只标注它——‘我在有没力气的念头’。能否带着它完成‘阳台 2 分钟’？”
- C: “可以试。”
- T: “好。完成后给自己点奖励：发一条感谢短信给伴侣。”

---

# CASE:social_perfectionism
id: case/social_perfectionism
keywords: [社交焦虑, 完美主义, 解离, 价值]
presenting: 29岁新人演讲前追求“零失误”，反复润色到凌晨、临场回避问答。
interventions: 解离“必须完美才可被认可”的钩子；价值=“清晰沟通&成长”；现实目标=“演讲 8 分钟，问答回答3问即可”；暴露：故意小延迟再回答。
sample_dialogue:
- T: “把‘零失误’这句印在便利贴上，读快 30 秒，你发现了什么？”
- C: “越来越像口号。”
- T: “好，把目标换成‘服务听众的清晰度’，今天我们只做 8 分钟版本+3个问答。”

---

# CASE:ocd_checking
id: case/ocd_checking
keywords: [强迫检查, 仪式, 接纳, 行为实验]
presenting: 34岁工程师反复锁门检查，迟到严重。
interventions: 价值=“可靠与守时”；暴露反应预防+接纳“没完全确定”的不适；If-Then：想回头→站定10呼吸接纳不适→继续前行30步。
sample_dialogue:
- T: “不去证明百分百确定，我们练习‘带着担心前行’。”
- C: “很难，但能走 30 步试试。”

---

# CASE:chronic_pain
id: case/chronic_pain
keywords: [慢性疼痛, 接纳, 价值一致活动]
presenting: 45岁教师慢性背痛，逐渐放弃喜爱的园艺。
interventions: 区分“痛苦/受苦”；接纳身体感受的幅度；价值=“创造与自然连接”；微步：每天 5 分钟花圃护理，痛感↑时做ACE再继续或休息后返回。
sample_dialogue:
- T: “痛在，但我们照顾与创造也在。今天的最小‘朝向’是什么？”
- C: “给玫瑰松土 5 分钟。”

---

# CASE:trauma_anchor_values
id: case/trauma_anchor_values
keywords: [创伤后, 触发, 抛锚, 安全计划]
presenting: 30岁来访者被声音触发闪回。
interventions: 先建立“抛锚”技能和安全清单；逐步暴露于触发音量；价值=“与伴侣共处时的在场感”；设置危机转介与支持网络。
sample_dialogue:
- T: “声音出现→承认里头的画面/心跳→脚踩地→说出房间三样物品；当你准备好，我们回到与伴侣的对话里，问一个开放问题。”

---

# CARD:micro/defusion_library
id: micro/defusion_library
keywords: [语言游戏, 命名故事, 角色扮演]
snippets:
- 给念头命名：“又来了——《失败者故事》。”
- 声线改变：把苛刻自评用播音腔/卡通声读 20 秒。
- 文字距离：把念头写在便签上，放远 1 米，再读一遍。

---

# CARD:micro/acceptance_library
id: micro/acceptance_library
keywords: [躯体扩容, 感官容纳]
snippets:
- 描述感受三参数：位置/形状/变化速度；用 3 次缓慢呼吸给它“留座位”。
- “愿意量表”0–10；从当前值+1 开始练一件小事。

---

# CARD:micro/present_library
id: micro/present_library
keywords: [五感点名, 任务聚焦]
snippets:
- 3-2-1 环境点名（3个看到/2个听到/1个触到）。
- 当前任务一句话：我正在＿＿，下一个微步是＿＿。

---

# CARD:values/elicitation
id: values/elicitation
keywords: [价值提取, 情境化]
prompts:
- “一年后回看今天，你希望因什么而自豪？”
- “当你不再被痛苦牵引时，想把时间投入给谁/什么？”
- 价值→行为映射：将价值翻译为“每周 1–2 个可观察的具体行动”。

---

# CARD:planning/committed_action
id: planning/committed_action
keywords: [目标设定, 反脆弱, 复盘]
template:
- 价值：＿＿；目标（可观察/可行/有时限）：＿＿；最小步：＿＿；障碍-FEAR：＿＿；DARE 对策：＿＿；复盘：做了/学到/下次微调。citeturn0search1

---

# CARD:assessment/choice_point_map
id: assessment/choice_point_map
keywords: [评估, formulation, toward/away]
fields:
- 触发|情境｜内在体验（想法/情绪/感受）
- Away Moves（短期舒缓/长期代价）
- Toward Moves（与价值一致的替代）
- 资源（人/地/物/时）
- If-Then 计划（含 ACE/DARE）

---

# CARD:ethics_safety
id: ethics_safety
keywords: [边界, 危机, 转介]
notes:
- 所有练习仅作心理教育与自助，不替代诊断/治疗；自/他伤及高风险症状需立刻走危机流程并转介。
- 远程场景建议先建立“紧急联系人+本地资源”清单，再推进体验式练习。

---

# CARD:citations
id: citations
keywords: [参考, 证据基础]
sources:
- ACT 六核心过程与 hexaflex 概述。citeturn0search11turn0search2
- Choice Point 工具与工作表（2017/2013 版本）。citeturn0search3turn0search7
- FEAR/DARE 工作表与手册。citeturn0search1turn0search6turn0search4
- Dropping Anchor/ACE 稳定练习。citeturn1search0
