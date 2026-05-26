import type { AppLocale } from '../appPreferences'

export type MessageKey =
  | 'about.description'
  | 'about.hackathon'
  | 'about.title'
  | 'about.version'
  | 'auth.backendUnavailable'
  | 'auth.accountMenu'
  | 'auth.backToChat'
  | 'auth.codeRequired'
  | 'auth.codeHint'
  | 'auth.codeSent'
  | 'auth.codeSentTo'
  | 'auth.displayName'
  | 'auth.displayNamePlaceholder'
  | 'auth.email'
  | 'auth.failed'
  | 'auth.invalidEmailForCode'
  | 'auth.resendCode'
  | 'auth.sendCode'
  | 'auth.sendingCode'
  | 'auth.verificationCode'
  | 'auth.verificationCodePlaceholder'
  | 'auth.intro'
  | 'auth.loggedInAs'
  | 'auth.loginSuccess'
  | 'auth.loginSubmit'
  | 'auth.loginTab'
  | 'auth.logout'
  | 'auth.logoutSuccess'
  | 'auth.password'
  | 'auth.registerIntro'
  | 'auth.registerSubmit'
  | 'auth.registerSuccess'
  | 'auth.registerTab'
  | 'auth.submitting'
  | 'auth.syncing'
  | 'auth.title'
  | 'settings.account'
  | 'settings.accountHint'
  | 'settings.accountLogin'
  | 'settings.accountManage'
  | 'settings.accountSyncing'
  | 'action.back'
  | 'action.cancel'
  | 'action.close'
  | 'action.copied'
  | 'action.copy'
  | 'action.edit'
  | 'action.editHint'
  | 'action.editTitle'
  | 'action.helpful'
  | 'action.helpfulMarked'
  | 'action.improve'
  | 'action.improveMarked'
  | 'action.regenerate'
  | 'action.regenerating'
  | 'action.retry'
  | 'action.saveSend'
  | 'avoid.alcohol'
  | 'avoid.fried'
  | 'avoid.organ'
  | 'avoid.sugar'
  | 'brand.tagline'
  | 'chat.closeSidebar'
  | 'chat.defaultTitle'
  | 'chat.demoBanner'
  | 'chat.demoBannerExtra'
  | 'chat.demoBannerLink'
  | 'chat.emptyHint'
  | 'chat.emptyReply'
  | 'chat.emptyTitle'
  | 'chat.locating'
  | 'chat.nearbyLoading'
  | 'chat.openHistory'
  | 'chat.placeholderGenerating'
  | 'chat.placeholderOffline'
  | 'chat.placeholderReady'
  | 'chat.scrollToBottom'
  | 'chat.statusOffline'
  | 'chat.statusOnline'
  | 'chat.statusWorking'
  | 'chat.stopped'
  | 'composer.send'
  | 'composer.stopGenerate'
  | 'composer.voiceStart'
  | 'composer.voiceStop'
  | 'cuisine.cantonese'
  | 'cuisine.japanese'
  | 'cuisine.light'
  | 'cuisine.sichuan'
  | 'cuisine.vegetarian'
  | 'cuisine.western'
  | 'dashboard.calories'
  | 'dashboard.consumed'
  | 'dashboard.remaining'
  | 'dashboard.setupBtn'
  | 'dashboard.setupHint'
  | 'dashboard.setupTitle'
  | 'dashboard.training'
  | 'dashboard.weekly'
  | 'detail.balanced'
  | 'detail.carbs'
  | 'detail.close'
  | 'detail.closeSheet'
  | 'detail.concise'
  | 'detail.detailed'
  | 'detail.fat'
  | 'detail.fiber'
  | 'detail.gymHint'
  | 'detail.navigate'
  | 'detail.noNavigate'
  | 'detail.nutrition'
  | 'detail.nutritionHint'
  | 'detail.protein'
  | 'detail.recoveryHint'
  | 'detail.mapLabel'
  | 'detail.mapLoading'
  | 'detail.routeWalk'
  | 'detail.routeUnavailable'
  | 'detail.mapNoOrigin'
  | 'detail.youAreHere'
  | 'detail.destination'
  | 'detail.openExternal'
  | 'eval.badgeLlm'
  | 'eval.badgeLocal'
  | 'goal.fat_loss'
  | 'goal.maintain'
  | 'goal.muscle_gain'
  | 'lang.en'
  | 'lang.ja'
  | 'lang.ko'
  | 'lang.zh'
  | 'meal.aiEstimate'
  | 'meal.hintAi'
  | 'meal.hintRules'
  | 'meal.letterFrom'
  | 'meal.ok'
  | 'meal.openEnvelope'
  | 'meal.placeholder'
  | 'meal.recommend.breakfast'
  | 'meal.recommend.dinner'
  | 'meal.recommend.low'
  | 'meal.recommend.lunch'
  | 'meal.recommend.medium'
  | 'meal.recorded'
  | 'meal.remainingIntake'
  | 'meal.reminderBody'
  | 'meal.reminderTitle'
  | 'meal.ruleEstimate'
  | 'meal.slot.breakfast'
  | 'meal.slot.dinner'
  | 'meal.slot.lunch'
  | 'meal.slotDefault'
  | 'meal.submit'
  | 'meal.submitting'
  | 'meal.todayConsumed'
  | 'meal.whatDidYouEat'
  | 'profile.activity'
  | 'profile.activityActive'
  | 'profile.activityLight'
  | 'profile.activityModerate'
  | 'profile.activitySedentary'
  | 'profile.age'
  | 'profile.avoid'
  | 'profile.cuisines'
  | 'profile.dailyTarget'
  | 'profile.height'
  | 'profile.hint'
  | 'profile.nickname'
  | 'profile.save'
  | 'profile.savedToast'
  | 'profile.sex'
  | 'profile.sexFemale'
  | 'profile.sexMale'
  | 'profile.sexSelect'
  | 'profile.title'
  | 'profile.validationMissing'
  | 'profile.weight'
  | 'quick.customPlan'
  | 'quick.defaultHint'
  | 'quick.eat.label'
  | 'quick.eat.prompt'
  | 'quick.move.label'
  | 'quick.move.prompt'
  | 'quick.recover.label'
  | 'quick.recover.prompt'
  | 'quick.train.label'
  | 'quick.train.prompt'
  | 'rail.badgePlan'
  | 'rail.badgeReply'
  | 'rail.badgeScene'
  | 'rail.confidence'
  | 'rail.hintExecuting'
  | 'rail.hintScoring'
  | 'richCard.viewDetail'
  | 'settings.aiDetail'
  | 'settings.aiEmoji'
  | 'settings.aiNearby'
  | 'settings.aiPrefs'
  | 'settings.aiTone'
  | 'settings.dev.accessKey'
  | 'settings.dev.activeConfig'
  | 'settings.dev.apiBaseUrl'
  | 'settings.dev.availableModels'
  | 'settings.dev.checking'
  | 'settings.dev.connected'
  | 'settings.dev.connectionLabel'
  | 'settings.dev.defaultConfig'
  | 'settings.dev.error'
  | 'settings.dev.idle'
  | 'settings.dev.model'
  | 'settings.dev.modelId'
  | 'settings.dev.notConfigured'
  | 'settings.dev.ready'
  | 'settings.dev.reset'
  | 'settings.dev.save'
  | 'settings.dev.testConnection'
  | 'settings.dev.token'
  | 'settings.dev.waiting'
  | 'settings.developer'
  | 'settings.developerAria'
  | 'settings.language'
  | 'settings.location'
  | 'settings.locationDenied'
  | 'settings.locationOff'
  | 'settings.locationSourceGps'
  | 'settings.locationSourceIp'
  | 'settings.locationUnavailable'
  | 'settings.mealReminders'
  | 'settings.privacy'
  | 'settings.saved'
  | 'settings.theme'
  | 'settings.themeDark'
  | 'settings.themeLight'
  | 'settings.title'
  | 'sidebar.about'
  | 'sidebar.badgeCurrent'
  | 'sidebar.current'
  | 'sidebar.deleteConversation'
  | 'sidebar.history'
  | 'sidebar.newChat'
  | 'sidebar.noConversation'
  | 'sidebar.noHistory'
  | 'sidebar.previewFallback'
  | 'sidebar.settings'
  | 'sidebar.yiqidong'
  | 'splash.badge1'
  | 'splash.badge2'
  | 'splash.badge3'
  | 'splash.accountLoggedInBadge'
  | 'splash.accountTitle'
  | 'splash.backToHome'
  | 'splash.headline1'
  | 'splash.headline2'
  | 'splash.heroAlt'
  | 'splash.subtitle'
  | 'splash.tagline'
  | 'splash.wakeBtn'
  | 'toast.connectionOk'
  | 'toast.conversationDeleted'
  | 'toast.conversationDeletedNew'
  | 'toast.developerUnlocked'
  | 'toast.editingResend'
  | 'toast.feedbackImprove'
  | 'toast.feedbackThanks'
  | 'toast.needConnection'
  | 'toast.newConversation'
  | 'toast.regenerating'
  | 'toast.sendFailed'
  | 'toast.settingsReset'
  | 'toast.stopped'
  | 'toast.voiceListening'
  | 'toast.voiceStarted'
  | 'toast.voiceUnsupported'
  | 'toast.yiqidongSaved'
  | 'tone.coach'
  | 'tone.friendly'
  | 'tone.professional'
  | 'typing.thinking'
  | 'yiqidong.addTime'
  | 'yiqidong.back'
  | 'yiqidong.casual'
  | 'yiqidong.casualBadge'
  | 'yiqidong.casualHint'
  | 'yiqidong.describe.casual'
  | 'yiqidong.describe.custom'
  | 'yiqidong.describe.daily'
  | 'yiqidong.describe.fallback'
  | 'yiqidong.describe.interval'
  | 'yiqidong.describe.off'
  | 'yiqidong.describe.weekly'
  | 'yiqidong.heroLabel'
  | 'yiqidong.inbox'
  | 'yiqidong.intervalDays'
  | 'yiqidong.letterAck'
  | 'yiqidong.letterShaking'
  | 'yiqidong.letterSignOff'
  | 'yiqidong.maxPerDay'
  | 'yiqidong.modalAria'
  | 'yiqidong.modeLabel'
  | 'yiqidong.noLetters'
  | 'yiqidong.off'
  | 'yiqidong.offHint'
  | 'yiqidong.offSummary'
  | 'yiqidong.pickDays'
  | 'yiqidong.pickLetter'
  | 'yiqidong.preview'
  | 'yiqidong.questAccept'
  | 'yiqidong.questCasualTitle'
  | 'yiqidong.questEyebrow'
  | 'yiqidong.questLater'
  | 'yiqidong.questScheduledTitle'
  | 'yiqidong.remove'
  | 'yiqidong.repeat'
  | 'yiqidong.repeat.custom'
  | 'yiqidong.repeat.daily'
  | 'yiqidong.repeat.interval'
  | 'yiqidong.repeat.weekly'
  | 'yiqidong.reset'
  | 'yiqidong.save'
  | 'yiqidong.scheduled'
  | 'yiqidong.scheduledBadge'
  | 'yiqidong.scheduledHint'
  | 'yiqidong.settingsIntro'
  | 'yiqidong.settingsTab'
  | 'yiqidong.times'
  | 'yiqidong.timesOnce'
  | 'yiqidong.timesThrice'
  | 'yiqidong.timesTwice'
  | 'yiqidong.title'
  | 'yiqidong.weekday.fri'
  | 'yiqidong.weekday.mon'
  | 'yiqidong.weekday.sat'
  | 'yiqidong.weekday.sun'
  | 'yiqidong.weekday.thu'
  | 'yiqidong.weekday.tue'
  | 'yiqidong.weekday.wed'

const ZH: Record<MessageKey, string> = {
  'about.description': '基于 OpenClaw 的本地生活减脂搭子——在真实场景里给你可执行的饮食与运动建议。',
  'about.hackathon': '美团黑客松赛道一',
  'about.title': '关于',
  'about.version': 'BurnPal v1.0',
  'auth.backToChat': '返回对话',
  'auth.accountMenu': '账户管理',
  'auth.backendUnavailable': '无法连接后端服务，请先启动 backend（npm run dev）',
  'auth.codeRequired': '请输入验证码',
  'auth.codeHint': '填写邮箱后将自动向该邮箱发送 6 位验证码',
  'auth.codeSent': '验证码已发送，请查收邮件',
  'auth.codeSentTo': '验证码已发送至 {email}，请查收邮件',
  'auth.displayName': '昵称',
  'auth.displayNamePlaceholder': '可选',
  'auth.email': '邮箱',
  'auth.failed': '操作失败，请稍后重试',
  'auth.invalidEmailForCode': '请先填写有效的邮箱地址',
  'auth.resendCode': '{seconds} 秒后重发',
  'auth.sendCode': '发送验证码',
  'auth.sendingCode': '正在发送验证码…',
  'auth.verificationCode': '验证码',
  'auth.verificationCodePlaceholder': '6 位数字',
  'auth.intro': '登录后，减脂档案、一起动、饮食记录与对话历史将同步到云端。',
  'auth.loggedInAs': '已登录',
  'auth.loginSuccess': '登录成功，数据已同步',
  'auth.loginSubmit': '登录',
  'auth.loginTab': '登录',
  'auth.logout': '退出登录',
  'auth.logoutSuccess': '已退出登录',
  'auth.password': '密码',
  'auth.registerIntro': '填写注册邮箱后，系统会自动发送验证码到该邮箱，验证通过即可完成注册并开启云端同步。',
  'auth.registerSubmit': '注册',
  'auth.registerSuccess': '注册成功！本地数据已上传，云端同步已开启',
  'auth.registerTab': '注册',
  'auth.submitting': '处理中…',
  'auth.syncing': '正在同步…',
  'auth.title': '账户',
  'action.back': '返回',
  'action.cancel': '取消',
  'action.close': '关闭',
  'action.copied': '已复制',
  'action.copy': '复制',
  'action.edit': '编辑',
  'action.editHint': 'Ctrl+Enter 发送 · Esc 取消',
  'action.editTitle': '编辑你的问题',
  'action.helpful': '有帮助',
  'action.helpfulMarked': '已标记有帮助',
  'action.improve': '需改进',
  'action.improveMarked': '已标记需改进',
  'action.regenerate': '重新生成',
  'action.regenerating': '生成中…',
  'action.retry': '重试',
  'action.saveSend': '保存并发送',
  'avoid.alcohol': '酒精',
  'avoid.fried': '油炸',
  'avoid.organ': '内脏',
  'avoid.sugar': '高糖',
  'brand.tagline': '你的 AI 本地生活减脂管家',
  'chat.closeSidebar': '关闭侧边栏',
  'chat.defaultTitle': '新对话',
  'chat.demoBanner': '演示模式：服务未连接，回复为本地示例。',
  'chat.demoBannerExtra': ' 连接 OpenClaw 后可获得真实 AI 回复。',
  'chat.demoBannerLink': '前往设置',
  'chat.emptyHint': '你的 AI 本地生活减脂管家 · 点击下方快捷入口开始对话。',
  'chat.emptyReply': '（暂无回复内容）',
  'chat.emptyTitle': '今天想聊点什么？',
  'chat.locating': '定位中…',
  'chat.nearbyLoading': '正在根据你的位置查找附近推荐…',
  'chat.openHistory': '打开历史对话',
  'chat.placeholderGenerating': '正在回复…',
  'chat.placeholderOffline': '服务暂不可用，请稍后在设置中重试',
  'chat.placeholderReady': '问问 BurnPal…',
  'chat.scrollToBottom': '回到底部',
  'chat.statusOffline': '离线',
  'chat.statusOnline': '轻鹭待命',
  'chat.statusWorking': '轻鹭思考中',
  'chat.stopped': '（已停止生成）',
  'composer.send': '发送',
  'composer.stopGenerate': '停止生成',
  'composer.voiceStart': '语音输入',
  'composer.voiceStop': '停止语音输入',
  'cuisine.cantonese': '粤菜',
  'cuisine.japanese': '日料',
  'cuisine.light': '轻食',
  'cuisine.sichuan': '川菜',
  'cuisine.vegetarian': '素食',
  'cuisine.western': '西餐',
  'dashboard.calories': '今日热量',
  'dashboard.consumed': '已摄入',
  'dashboard.remaining': '剩余',
  'dashboard.setupBtn': '立即设置',
  'dashboard.setupHint': '填写身高体重与目标，解锁热量预算与训练安排',
  'dashboard.setupTitle': '完善减脂档案',
  'dashboard.training': '训练计划',
  'dashboard.weekly': '本周频率',
  'detail.balanced': '均衡',
  'detail.carbs': '碳水',
  'detail.close': '关闭',
  'detail.closeSheet': '关闭详情',
  'detail.concise': '简洁',
  'detail.detailed': '详细',
  'detail.fat': '脂肪',
  'detail.fiber': '纤维',
  'detail.gymHint': '到店前建议确认营业时间、器械与团课安排；练后可搭配附近恢复场地做拉伸。',
  'detail.navigate': '一键导航',
  'detail.noNavigate': '暂无坐标，无法导航',
  'detail.nutrition': '参考营养结构',
  'detail.nutritionHint': '示例估算，非门店实测',
  'detail.protein': '蛋白质',
  'detail.recoveryHint': '适合练后散步与静态拉伸；注意防晒补水，避开高峰人流时段更舒适。',
  'detail.mapLabel': '路线地图',
  'detail.mapLoading': '正在规划步行路线…',
  'detail.routeWalk': '步行',
  'detail.routeUnavailable': '暂时无法规划路线，可查看标记点',
  'detail.mapNoOrigin': '开启位置服务后可显示步行路线',
  'detail.youAreHere': '你的位置',
  'detail.destination': '目的地',
  'detail.openExternal': '打开系统地图',
  'eval.badgeLlm': 'AI 质量',
  'eval.badgeLocal': '本地质量',
  'goal.fat_loss': '科学减脂',
  'goal.maintain': '维持体态',
  'goal.muscle_gain': '增肌塑形',
  'lang.en': 'English',
  'lang.ja': '日本語',
  'lang.ko': '한국어',
  'lang.zh': '简体中文',
  'meal.aiEstimate': ' · AI 估算',
  'meal.hintAi': '已通过 AI 估算热量',
  'meal.hintRules': '离线规则估算，连接服务后可 AI 精算',
  'meal.letterFrom': '轻鹭来信 · {slot}提醒',
  'meal.ok': '好的',
  'meal.openEnvelope': '拆开信封',
  'meal.placeholder': '例如：轻食鸡胸碗、公司食堂一荤两素…',
  'meal.recommend.breakfast': '推荐：全麦三明治 + 水煮蛋 + 无糖豆浆，约 380 kcal，开启稳定代谢。',
  'meal.recommend.dinner': '推荐：高蛋白低脂晚餐，如烤鱼/鸡胸配蔬菜，避免睡前高油高糖。',
  'meal.recommend.low': '今日热量预算所剩不多，建议下一餐选择轻食沙拉、希腊酸奶或无糖豆浆。',
  'meal.recommend.lunch': '推荐：轻食食堂鸡胸碗或日式定食，控制在 550 kcal 内。',
  'meal.recommend.medium': '推荐：香煎鸡胸能量碗（约 520 kcal）或清蒸鱼配时蔬，高蛋白低脂。',
  'meal.recorded': '已记录 {kcal} kcal',
  'meal.remainingIntake': '还可摄入 {remaining} kcal',
  'meal.reminderBody': '记录你吃了什么，轻鹭会帮你估算热量。今日还可摄入约 {remaining} kcal。',
  'meal.reminderTitle': '{slot}时间到啦',
  'meal.ruleEstimate': ' · 规则估算',
  'meal.slot.breakfast': '早餐',
  'meal.slot.dinner': '晚餐',
  'meal.slot.lunch': '午餐',
  'meal.slotDefault': '用餐',
  'meal.submit': '记录并估算热量',
  'meal.submitting': 'AI 估算中…',
  'meal.todayConsumed': ' · 今日已摄入 {consumed} kcal',
  'meal.whatDidYouEat': '你{slot}吃了什么？',
  'profile.activity': '活动量',
  'profile.activityActive': '较高',
  'profile.activityLight': '轻度',
  'profile.activityModerate': '中等',
  'profile.activitySedentary': '久坐',
  'profile.age': '年龄',
  'profile.avoid': '需要避开',
  'profile.cuisines': '喜欢的菜系',
  'profile.dailyTarget': '每日目标 {kcal} kcal · 蛋白质 {protein}g · {session}',
  'profile.height': '身高 (cm)',
  'profile.hint': '填写身体数据与目标，轻鹭会生成每日热量预算与训练安排。',
  'profile.nickname': '昵称',
  'profile.save': '保存并更新计划',
  'profile.savedToast': '减脂档案已保存，热量与训练计划已生成',
  'profile.sex': '性别',
  'profile.sexFemale': '女',
  'profile.sexMale': '男',
  'profile.sexSelect': '请选择',
  'profile.title': '减脂档案 · 训练计划',
  'profile.validationMissing': '请填写身高、体重和健身目标',
  'profile.weight': '体重 (kg)',
  'quick.customPlan': '定制今日计划',
  'quick.defaultHint': '点击咨询',
  'quick.eat.label': '吃什么',
  'quick.eat.prompt': '今天下班后吃什么比较合适？',
  'quick.move.label': '一起动',
  'quick.move.prompt': '帮我安排今天的运动计划',
  'quick.recover.label': '恢复一下',
  'quick.recover.prompt': '今天练完腿了，给我一些拉伸恢复建议',
  'quick.train.label': '去哪练',
  'quick.train.prompt': '帮我找附近适合力量训练的健身房',
  'rail.badgePlan': '思考',
  'rail.badgeReply': '回复',
  'rail.badgeScene': '场景',
  'rail.confidence': '置信',
  'rail.hintExecuting': '正在组织回答…',
  'rail.hintScoring': '回答已生成，轻鹭正在校验质量…',
  'richCard.viewDetail': '查看详情',
  'settings.aiDetail': '详略程度',
  'settings.aiEmoji': '适度使用表情',
  'settings.aiNearby': '优先结合附近推荐',
  'settings.aiPrefs': 'AI 回答偏好',
  'settings.aiTone': '语气风格',
  'settings.dev.accessKey': '访问密钥',
  'settings.dev.activeConfig': '当前生效',
  'settings.dev.apiBaseUrl': 'API 服务地址',
  'settings.dev.availableModels': '可用模型',
  'settings.dev.checking': '检查中',
  'settings.dev.connected': '在线',
  'settings.dev.connectionLabel': '服务状态',
  'settings.dev.defaultConfig': '默认配置',
  'settings.dev.error': '连接异常',
  'settings.dev.idle': '未检查',
  'settings.dev.model': '模型',
  'settings.dev.modelId': '模型 ID',
  'settings.dev.notConfigured': '未配置',
  'settings.dev.ready': '轻鹭在线',
  'settings.dev.reset': '恢复默认',
  'settings.dev.save': '保存设置',
  'settings.dev.testConnection': '测试连接',
  'settings.dev.token': '密钥',
  'settings.dev.waiting': '暂时无法连接',
  'settings.developer': 'Developer',
  'settings.developerAria': 'Developer',
  'settings.language': '显示语言',
  'settings.location': '位置服务',
  'settings.locationDenied': '位置权限被拒绝',
  'settings.locationOff': '位置服务已关闭',
  'settings.locationSourceGps': 'GPS 定位',
  'settings.locationSourceIp': 'IP 定位',
  'settings.locationUnavailable': '暂时无法获取位置',
  'settings.mealReminders': '三餐信封提醒',
  'settings.privacy': '隐私与通知',
  'settings.saved': '偏好已保存',
  'settings.theme': '外观主题',
  'settings.themeDark': '暗色',
  'settings.themeLight': '亮色',
  'settings.account': '账户与云同步',
  'settings.accountHint': '登录后自动同步档案、一起动、饮食记录与对话历史',
  'settings.accountLogin': '登录 / 注册',
  'settings.accountManage': '管理账户',
  'settings.accountSyncing': '同步中…',
  'settings.title': '设置',
  'sidebar.about': '关于',
  'sidebar.badgeCurrent': '当前',
  'sidebar.current': '当前对话',
  'sidebar.deleteConversation': '删除对话 {title}',
  'sidebar.history': '历史记录',
  'sidebar.newChat': '新建对话',
  'sidebar.noConversation': '还没有对话',
  'sidebar.noHistory': '暂无历史记录',
  'sidebar.previewFallback': '开始和轻鹭聊聊…',
  'sidebar.settings': '设置',
  'sidebar.yiqidong': '一起动',
  'splash.badge1': '排球 · 有氧燃脂',
  'splash.badge2': '附近场馆推荐',
  'splash.badge3': 'AI 训练计划',
  'splash.accountLoggedInBadge': '已登录 · 云端同步中',
  'splash.accountTitle': '注册 / 登录 · 云端同步',
  'splash.backToHome': '返回首页',
  'splash.headline1': '轻盈随行，',
  'splash.headline2': '乐享生活',
  'splash.heroAlt': '轻鹭 · 排球运动场景',
  'splash.subtitle': '和轻鹭聊聊饮食、热量与运动计划',
  'splash.tagline': '智慧本地 · 全天候 AI 减脂管家',
  'splash.wakeBtn': '唤醒管家',
  'toast.connectionOk': '连接成功，轻鹭已就绪',
  'toast.conversationDeleted': '对话已删除',
  'toast.conversationDeletedNew': '已为你开启新对话',
  'toast.developerUnlocked': '已开启开发者模式',
  'toast.editingResend': '正在根据新问题生成回复…',
  'toast.feedbackImprove': '感谢反馈，轻鹭会继续改进',
  'toast.feedbackThanks': '感谢您的反馈！',
  'toast.needConnection': '请先完成连接后再开始对话',
  'toast.newConversation': '已开始新对话',
  'toast.regenerating': '正在重新生成…',
  'toast.sendFailed': '消息发送失败，请稍后重试',
  'toast.settingsReset': '已恢复默认设置',
  'toast.stopped': '已停止生成',
  'toast.voiceListening': '正在聆听…',
  'toast.voiceStarted': '语音输入已开始，请说话',
  'toast.voiceUnsupported': '当前浏览器不支持语音输入，请使用 Chrome 或 Edge',
  'toast.yiqidongSaved': '一起动已保存 · {summary}',
  'tone.coach': '教练型',
  'tone.friendly': '亲切',
  'tone.professional': '专业',
  'typing.thinking': '轻鹭正在思考',
  'yiqidong.addTime': '添加时间',
  'yiqidong.back': '返回',
  'yiqidong.casual': '随心推',
  'yiqidong.casualBadge': '随心推',
  'yiqidong.casualHint': '天气和空气合适时偶尔推送，不频繁打扰',
  'yiqidong.describe.casual': '随心推 · 每日最多 {count} 次',
  'yiqidong.describe.custom': '{days} {times}',
  'yiqidong.describe.daily': '每天 {times}',
  'yiqidong.describe.fallback': '固定提醒 {times}',
  'yiqidong.describe.interval': '每 {days} 天 {times}',
  'yiqidong.describe.off': '未开启',
  'yiqidong.describe.weekly': '每周 {times}',
  'yiqidong.heroLabel': '运动提醒',
  'yiqidong.inbox': '信箱',
  'yiqidong.intervalDays': '间隔天数',
  'yiqidong.letterAck': '知道了',
  'yiqidong.letterShaking': '轻鹭来信了…',
  'yiqidong.letterSignOff': '—— 轻鹭',
  'yiqidong.maxPerDay': '每日最多提醒',
  'yiqidong.modalAria': '一起动信箱',
  'yiqidong.modeLabel': '提醒方式',
  'yiqidong.noLetters': '暂无信件，可在设置中开启提醒',
  'yiqidong.off': '关闭',
  'yiqidong.offHint': '不接收运动提醒推送',
  'yiqidong.offSummary': '未开启',
  'yiqidong.pickDays': '选择星期',
  'yiqidong.pickLetter': '选一封信阅读',
  'yiqidong.preview': '当前设置',
  'yiqidong.questAccept': '查看',
  'yiqidong.questCasualTitle': '随心任务',
  'yiqidong.questEyebrow': '新委托',
  'yiqidong.questLater': '稍后',
  'yiqidong.questScheduledTitle': '运动委托',
  'yiqidong.remove': '移除',
  'yiqidong.repeat': '重复周期',
  'yiqidong.repeat.custom': '指定星期',
  'yiqidong.repeat.daily': '每天',
  'yiqidong.repeat.interval': '每 N 天',
  'yiqidong.repeat.weekly': '每周',
  'yiqidong.reset': '恢复默认',
  'yiqidong.save': '保存',
  'yiqidong.scheduled': '固定提醒',
  'yiqidong.scheduledBadge': '提醒',
  'yiqidong.scheduledHint': '按你设定的时间与周期推送运动建议',
  'yiqidong.settingsIntro': '选择提醒方式并保存，轻鹭会按设定推送运动建议。',
  'yiqidong.settingsTab': '设置',
  'yiqidong.times': '提醒时间',
  'yiqidong.timesOnce': '1 次',
  'yiqidong.timesThrice': '3 次',
  'yiqidong.timesTwice': '2 次',
  'yiqidong.title': '一起动',
  'yiqidong.weekday.fri': '五',
  'yiqidong.weekday.mon': '一',
  'yiqidong.weekday.sat': '六',
  'yiqidong.weekday.sun': '日',
  'yiqidong.weekday.thu': '四',
  'yiqidong.weekday.tue': '二',
  'yiqidong.weekday.wed': '三',
}

const EN: Record<MessageKey, string> = {
  'about.description': 'OpenClaw-powered local fitness buddy — actionable diet and workout tips in real-life scenarios.',
  'about.hackathon': 'Meituan Hackathon Track 1',
  'about.title': 'About',
  'about.version': 'BurnPal v1.0',
  'auth.backToChat': 'Back to chat',
  'auth.accountMenu': 'Account',
  'auth.backendUnavailable': 'Cannot reach the backend. Start it with: cd backend && npm run dev',
  'auth.codeRequired': 'Enter the verification code',
  'auth.codeHint': 'A 6-digit code will be sent to this email automatically',
  'auth.codeSent': 'Verification code sent — check your email',
  'auth.codeSentTo': 'Verification code sent to {email} — check your inbox',
  'auth.displayName': 'Display name',
  'auth.displayNamePlaceholder': 'Optional',
  'auth.email': 'Email',
  'auth.failed': 'Something went wrong. Try again.',
  'auth.invalidEmailForCode': 'Enter a valid email address first',
  'auth.resendCode': 'Resend in {seconds}s',
  'auth.sendCode': 'Send code',
  'auth.sendingCode': 'Sending verification code…',
  'auth.verificationCode': 'Verification code',
  'auth.verificationCodePlaceholder': '6-digit code',
  'auth.intro': 'Sign in to sync your profile, Move Together, meal logs, chat history, and preferences to the cloud.',
  'auth.loggedInAs': 'Signed in as',
  'auth.loginSuccess': 'Logged in — data synced',
  'auth.loginSubmit': 'Log in',
  'auth.loginTab': 'Log in',
  'auth.logout': 'Log out',
  'auth.logoutSuccess': 'Logged out',
  'auth.password': 'Password',
  'auth.registerIntro': 'Enter your email and we will automatically send a verification code to that address. Complete verification to create your account and enable cloud sync.',
  'auth.registerSubmit': 'Sign up',
  'auth.registerSuccess': 'Account created — local data uploaded',
  'auth.registerTab': 'Sign up',
  'auth.submitting': 'Working…',
  'auth.syncing': 'Syncing…',
  'auth.title': 'Account',
  'action.back': 'Back',
  'action.cancel': 'Cancel',
  'action.close': 'Close',
  'action.copied': 'Copied',
  'action.copy': 'Copy',
  'action.edit': 'Edit',
  'action.editHint': 'Ctrl+Enter send · Esc cancel',
  'action.editTitle': 'Edit your question',
  'action.helpful': 'Helpful',
  'action.helpfulMarked': 'Marked helpful',
  'action.improve': 'Needs work',
  'action.improveMarked': 'Marked for improvement',
  'action.regenerate': 'Regenerate',
  'action.regenerating': 'Generating…',
  'action.retry': 'Retry',
  'action.saveSend': 'Save & send',
  'avoid.alcohol': 'Alcohol',
  'avoid.fried': 'Fried food',
  'avoid.organ': 'Organ meats',
  'avoid.sugar': 'High sugar',
  'brand.tagline': 'Your AI local fitness companion',
  'chat.closeSidebar': 'Close sidebar',
  'chat.defaultTitle': 'New chat',
  'chat.demoBanner': 'Demo mode: not connected. Replies are local samples.',
  'chat.demoBannerExtra': ' Connect OpenClaw for real AI replies.',
  'chat.demoBannerLink': 'Open settings',
  'chat.emptyHint': 'Your local fitness & lifestyle AI · Tap a quick action below.',
  'chat.emptyReply': '(No reply yet)',
  'chat.emptyTitle': 'What would you like to talk about?',
  'chat.locating': 'Locating…',
  'chat.nearbyLoading': 'Finding nearby picks…',
  'chat.openHistory': 'Open chat history',
  'chat.placeholderGenerating': 'Replying…',
  'chat.placeholderOffline': 'Service unavailable. Retry in Settings.',
  'chat.placeholderReady': 'Ask BurnPal…',
  'chat.scrollToBottom': 'Scroll to bottom',
  'chat.statusOffline': 'Offline',
  'chat.statusOnline': 'Qinglu ready',
  'chat.statusWorking': 'Qinglu thinking',
  'chat.stopped': '(Generation stopped)',
  'composer.send': 'Send',
  'composer.stopGenerate': 'Stop generating',
  'composer.voiceStart': 'Voice input',
  'composer.voiceStop': 'Stop voice input',
  'cuisine.cantonese': 'Cantonese',
  'cuisine.japanese': 'Japanese',
  'cuisine.light': 'Light meals',
  'cuisine.sichuan': 'Sichuan',
  'cuisine.vegetarian': 'Vegetarian',
  'cuisine.western': 'Western',
  'dashboard.calories': 'Calories today',
  'dashboard.consumed': 'Eaten',
  'dashboard.remaining': 'Left',
  'dashboard.setupBtn': 'Set up now',
  'dashboard.setupHint': 'Add height, weight & goal to unlock calorie and training plans',
  'dashboard.setupTitle': 'Complete your profile',
  'dashboard.training': 'Training plan',
  'dashboard.weekly': 'Weekly freq.',
  'detail.balanced': 'Balanced',
  'detail.carbs': 'Carbs',
  'detail.close': 'Close',
  'detail.closeSheet': 'Close details',
  'detail.concise': 'Concise',
  'detail.detailed': 'Detailed',
  'detail.fat': 'Fat',
  'detail.fiber': 'Fiber',
  'detail.gymHint': 'Confirm hours, equipment, and classes before visiting; stretch at nearby recovery spots after training.',
  'detail.navigate': 'Navigate',
  'detail.noNavigate': 'No coordinates — cannot navigate',
  'detail.nutrition': 'Nutrition reference',
  'detail.nutritionHint': 'Sample estimate, not measured in-store',
  'detail.protein': 'Protein',
  'detail.recoveryHint': 'Good for post-workout walks and static stretching; stay hydrated and avoid peak crowds.',
  'detail.mapLabel': 'Route map',
  'detail.mapLoading': 'Planning walking route…',
  'detail.routeWalk': 'Walk',
  'detail.routeUnavailable': 'Route unavailable — showing marker only',
  'detail.mapNoOrigin': 'Enable location for walking route',
  'detail.youAreHere': 'You are here',
  'detail.destination': 'Destination',
  'detail.openExternal': 'Open in Maps app',
  'eval.badgeLlm': 'AI quality',
  'eval.badgeLocal': 'Local quality',
  'goal.fat_loss': 'Fat loss',
  'goal.maintain': 'Maintain',
  'goal.muscle_gain': 'Muscle gain',
  'lang.en': 'English',
  'lang.ja': '日本語',
  'lang.ko': '한국어',
  'lang.zh': '简体中文',
  'meal.aiEstimate': ' · AI estimate',
  'meal.hintAi': 'Calories estimated by AI',
  'meal.hintRules': 'Offline rule estimate — connect for AI',
  'meal.letterFrom': 'Letter from Qinglu · {slot}',
  'meal.ok': 'OK',
  'meal.openEnvelope': 'Open letter',
  'meal.placeholder': 'e.g. chicken bowl, cafeteria plate…',
  'meal.recommend.breakfast': 'Whole-grain sandwich, boiled egg, unsweetened soy milk — ~380 kcal to kick-start metabolism.',
  'meal.recommend.dinner': 'High-protein, low-fat dinner — grilled fish or chicken with veggies; avoid heavy food before bed.',
  'meal.recommend.low': 'Budget is tight — try salad, Greek yogurt, or unsweetened soy milk next.',
  'meal.recommend.lunch': 'Light chicken bowl or Japanese set — keep under 550 kcal.',
  'meal.recommend.medium': 'Try grilled chicken bowl (~520 kcal) or steamed fish with veggies — high protein, low fat.',
  'meal.recorded': 'Logged {kcal} kcal',
  'meal.remainingIntake': '{remaining} kcal left',
  'meal.reminderBody': 'Log what you ate — Qinglu will estimate calories. About {remaining} kcal left today.',
  'meal.reminderTitle': '{slot} time!',
  'meal.ruleEstimate': ' · rule estimate',
  'meal.slot.breakfast': 'Breakfast',
  'meal.slot.dinner': 'Dinner',
  'meal.slot.lunch': 'Lunch',
  'meal.slotDefault': 'Meal',
  'meal.submit': 'Log & estimate calories',
  'meal.submitting': 'AI estimating…',
  'meal.todayConsumed': ' · eaten today {consumed} kcal',
  'meal.whatDidYouEat': 'What did you eat for {slot}?',
  'profile.activity': 'Activity level',
  'profile.activityActive': 'Active',
  'profile.activityLight': 'Light',
  'profile.activityModerate': 'Moderate',
  'profile.activitySedentary': 'Sedentary',
  'profile.age': 'Age',
  'profile.avoid': 'Avoid',
  'profile.cuisines': 'Favorite cuisines',
  'profile.dailyTarget': 'Daily {kcal} kcal · protein {protein}g · {session}',
  'profile.height': 'Height (cm)',
  'profile.hint': 'Enter your stats and goals — Qinglu will set daily calories and training.',
  'profile.nickname': 'Nickname',
  'profile.save': 'Save & update plan',
  'profile.savedToast': 'Profile saved — calorie and training plans updated',
  'profile.sex': 'Sex',
  'profile.sexFemale': 'Female',
  'profile.sexMale': 'Male',
  'profile.sexSelect': 'Select',
  'profile.title': 'Profile · training plan',
  'profile.validationMissing': 'Enter height, weight, and fitness goal',
  'profile.weight': 'Weight (kg)',
  'quick.customPlan': 'Custom plan',
  'quick.defaultHint': 'Tap to ask',
  'quick.eat.label': 'What to eat',
  'quick.eat.prompt': 'What should I eat after work today?',
  'quick.move.label': 'Move together',
  'quick.move.prompt': 'Plan my workout for today',
  'quick.recover.label': 'Recover',
  'quick.recover.prompt': 'I finished leg day — suggest stretching and recovery',
  'quick.train.label': 'Where to train',
  'quick.train.prompt': 'Find a nearby gym for strength training',
  'rail.badgePlan': 'Thinking',
  'rail.badgeReply': 'Reply',
  'rail.badgeScene': 'Scene',
  'rail.confidence': 'Confidence',
  'rail.hintExecuting': 'Organizing your answer…',
  'rail.hintScoring': 'Answer ready — Qinglu is checking quality…',
  'richCard.viewDetail': 'View details',
  'settings.aiDetail': 'Detail level',
  'settings.aiEmoji': 'Use emojis',
  'settings.aiNearby': 'Prefer nearby picks',
  'settings.aiPrefs': 'AI response style',
  'settings.aiTone': 'Tone',
  'settings.dev.accessKey': 'Access token',
  'settings.dev.activeConfig': 'Active config',
  'settings.dev.apiBaseUrl': 'API base URL',
  'settings.dev.availableModels': 'Available models',
  'settings.dev.checking': 'Checking',
  'settings.dev.connected': 'Online',
  'settings.dev.connectionLabel': 'Service status',
  'settings.dev.defaultConfig': 'Default config',
  'settings.dev.error': 'Connection error',
  'settings.dev.idle': 'Not checked',
  'settings.dev.model': 'Model',
  'settings.dev.modelId': 'Model ID',
  'settings.dev.notConfigured': 'Not configured',
  'settings.dev.ready': 'Qinglu online',
  'settings.dev.reset': 'Reset defaults',
  'settings.dev.save': 'Save settings',
  'settings.dev.testConnection': 'Test connection',
  'settings.dev.token': 'Token',
  'settings.dev.waiting': 'Cannot connect',
  'settings.developer': 'Developer',
  'settings.developerAria': 'Developer',
  'settings.language': 'Language',
  'settings.location': 'Location services',
  'settings.locationDenied': 'Location permission denied',
  'settings.locationOff': 'Location services off',
  'settings.locationSourceGps': 'GPS',
  'settings.locationSourceIp': 'IP location',
  'settings.locationUnavailable': 'Unable to get location',
  'settings.mealReminders': 'Meal reminders',
  'settings.privacy': 'Privacy & alerts',
  'settings.saved': 'Preferences saved',
  'settings.theme': 'Appearance',
  'settings.themeDark': 'Dark',
  'settings.themeLight': 'Light',
  'settings.account': 'Account & cloud sync',
  'settings.accountHint': 'Sync profile, Move Together, meal logs, and chat history when signed in',
  'settings.accountLogin': 'Log in / Sign up',
  'settings.accountManage': 'Manage account',
  'settings.accountSyncing': 'Syncing…',
  'settings.title': 'Settings',
  'sidebar.about': 'About',
  'sidebar.badgeCurrent': 'Current',
  'sidebar.current': 'Current',
  'sidebar.deleteConversation': 'Delete chat {title}',
  'sidebar.history': 'History',
  'sidebar.newChat': 'New chat',
  'sidebar.noConversation': 'No conversations yet',
  'sidebar.noHistory': 'No history yet',
  'sidebar.previewFallback': 'Start chatting with Qinglu…',
  'sidebar.settings': 'Settings',
  'sidebar.yiqidong': 'Move together',
  'splash.badge1': 'Volleyball · cardio burn',
  'splash.badge2': 'Nearby venues',
  'splash.badge3': 'AI training plans',
  'splash.accountLoggedInBadge': 'Signed in · cloud sync on',
  'splash.accountTitle': 'Sign up / Log in · Cloud sync',
  'splash.backToHome': 'Back to home',
  'splash.headline1': 'Travel light,',
  'splash.headline2': 'live well',
  'splash.heroAlt': 'Qinglu · volleyball scene',
  'splash.subtitle': 'Chat with Qinglu about meals, calories, and workouts',
  'splash.tagline': 'Smart local · 24/7 AI fitness companion',
  'splash.wakeBtn': 'Wake assistant',
  'toast.connectionOk': 'Connected — Qinglu is ready',
  'toast.conversationDeleted': 'Chat deleted',
  'toast.conversationDeletedNew': 'Started a new chat for you',
  'toast.developerUnlocked': 'Developer mode enabled',
  'toast.editingResend': 'Generating a new reply…',
  'toast.feedbackImprove': 'Thanks — we will keep improving.',
  'toast.feedbackThanks': 'Thanks for your feedback!',
  'toast.needConnection': 'Connect first before chatting',
  'toast.newConversation': 'New chat started',
  'toast.regenerating': 'Regenerating…',
  'toast.sendFailed': 'Send failed — try again later',
  'toast.settingsReset': 'Defaults restored',
  'toast.stopped': 'Generation stopped',
  'toast.voiceListening': 'Listening…',
  'toast.voiceStarted': 'Listening — speak now',
  'toast.voiceUnsupported': 'Voice input needs Chrome or Edge',
  'toast.yiqidongSaved': 'Move together saved · {summary}',
  'tone.coach': 'Coach',
  'tone.friendly': 'Friendly',
  'tone.professional': 'Professional',
  'typing.thinking': 'Qinglu is thinking',
  'yiqidong.addTime': 'Add time',
  'yiqidong.back': 'Back',
  'yiqidong.casual': 'Casual nudges',
  'yiqidong.casualBadge': 'Casual',
  'yiqidong.casualHint': 'Occasional nudges when weather and air are good',
  'yiqidong.describe.casual': 'Casual · up to {count}/day',
  'yiqidong.describe.custom': '{days} {times}',
  'yiqidong.describe.daily': 'Daily {times}',
  'yiqidong.describe.fallback': 'Scheduled {times}',
  'yiqidong.describe.interval': 'Every {days} days {times}',
  'yiqidong.describe.off': 'Off',
  'yiqidong.describe.weekly': 'Weekly {times}',
  'yiqidong.heroLabel': 'Workout reminders',
  'yiqidong.inbox': 'Inbox',
  'yiqidong.intervalDays': 'Interval days',
  'yiqidong.letterAck': 'Got it',
  'yiqidong.letterShaking': 'A letter from Qinglu…',
  'yiqidong.letterSignOff': '—— Qinglu',
  'yiqidong.maxPerDay': 'Max per day',
  'yiqidong.modalAria': 'Move together inbox',
  'yiqidong.modeLabel': 'Reminder mode',
  'yiqidong.noLetters': 'No letters yet — enable reminders in settings',
  'yiqidong.off': 'Off',
  'yiqidong.offHint': 'No workout reminder pushes',
  'yiqidong.offSummary': 'Off',
  'yiqidong.pickDays': 'Pick weekdays',
  'yiqidong.pickLetter': 'Pick a letter to read',
  'yiqidong.preview': 'Current settings',
  'yiqidong.questAccept': 'View',
  'yiqidong.questCasualTitle': 'Casual quest',
  'yiqidong.questEyebrow': 'New quest',
  'yiqidong.questLater': 'Later',
  'yiqidong.questScheduledTitle': 'Workout quest',
  'yiqidong.remove': 'Remove',
  'yiqidong.repeat': 'Repeat',
  'yiqidong.repeat.custom': 'Custom weekdays',
  'yiqidong.repeat.daily': 'Daily',
  'yiqidong.repeat.interval': 'Every N days',
  'yiqidong.repeat.weekly': 'Weekly',
  'yiqidong.reset': 'Reset',
  'yiqidong.save': 'Save',
  'yiqidong.scheduled': 'Scheduled',
  'yiqidong.scheduledBadge': 'Reminder',
  'yiqidong.scheduledHint': 'Push workout tips on your schedule',
  'yiqidong.settingsIntro': 'Pick a mode and save — Qinglu will remind you to move.',
  'yiqidong.settingsTab': 'Settings',
  'yiqidong.times': 'Reminder times',
  'yiqidong.timesOnce': '1 time',
  'yiqidong.timesThrice': '3 times',
  'yiqidong.timesTwice': '2 times',
  'yiqidong.title': 'Move together',
  'yiqidong.weekday.fri': 'Fri',
  'yiqidong.weekday.mon': 'Mon',
  'yiqidong.weekday.sat': 'Sat',
  'yiqidong.weekday.sun': 'Sun',
  'yiqidong.weekday.thu': 'Thu',
  'yiqidong.weekday.tue': 'Tue',
  'yiqidong.weekday.wed': 'Wed',
}

const JA: Record<MessageKey, string> = {
  'about.description': 'OpenClaw ベースのローカル減脂パートナー — リアルな場面で実行可能な食事・運動アドバイス。',
  'about.hackathon': '美団ハッカソン トラック1',
  'about.title': 'について',
  'about.version': 'BurnPal v1.0',
  'auth.backToChat': 'チャットに戻る',
  'auth.accountMenu': 'アカウント管理',
  'auth.backendUnavailable': 'バックエンドに接続できません。backend で npm run dev を実行してください',
  'auth.codeRequired': '認証コードを入力してください',
  'auth.codeHint': 'メールアドレス入力後、このアドレスに6桁コードを自動送信します',
  'auth.codeSent': '認証コードを送信しました。メールをご確認ください',
  'auth.codeSentTo': '認証コードを {email} に送信しました。メールをご確認ください',
  'auth.displayName': 'ニックネーム',
  'auth.displayNamePlaceholder': '任意',
  'auth.email': 'メール',
  'auth.failed': '失敗しました。もう一度お試しください',
  'auth.invalidEmailForCode': '有効なメールアドレスを入力してください',
  'auth.resendCode': '{seconds}秒後に再送',
  'auth.sendCode': 'コードを送信',
  'auth.sendingCode': '認証コードを送信中…',
  'auth.verificationCode': '認証コード',
  'auth.verificationCodePlaceholder': '6桁の数字',
  'auth.intro': 'ログインするとプロフィール・一緒に動く・食事記録・会話履歴などがクラウド同期されます。',
  'auth.loggedInAs': 'ログイン中',
  'auth.loginSuccess': 'ログイン完了 — 同期しました',
  'auth.loginSubmit': 'ログイン',
  'auth.loginTab': 'ログイン',
  'auth.logout': 'ログアウト',
  'auth.logoutSuccess': 'ログアウトしました',
  'auth.password': 'パスワード',
  'auth.registerIntro': '登録メールを入力すると、そのアドレスに認証コードを自動送信します。認証後に登録とクラウド同期が有効になります。',
  'auth.registerSubmit': '登録',
  'auth.registerSuccess': '登録完了 — ローカルデータをアップロードしました',
  'auth.registerTab': '登録',
  'auth.submitting': '処理中…',
  'auth.syncing': '同期中…',
  'auth.title': 'アカウント',
  'action.back': '戻る',
  'action.cancel': 'キャンセル',
  'action.close': '閉じる',
  'action.copied': 'コピー済',
  'action.copy': 'コピー',
  'action.edit': '編集',
  'action.editHint': 'Ctrl+Enter 送信 · Esc キャンセル',
  'action.editTitle': '質問を編集',
  'action.helpful': '役に立った',
  'action.helpfulMarked': '役に立ったとマーク',
  'action.improve': '改善が必要',
  'action.improveMarked': '改善マーク済',
  'action.regenerate': '再生成',
  'action.regenerating': '生成中…',
  'action.retry': '再試行',
  'action.saveSend': '保存して送信',
  'avoid.alcohol': 'アルコール',
  'avoid.fried': '揚げ物',
  'avoid.organ': '内臓',
  'avoid.sugar': '高糖',
  'brand.tagline': 'AI ローカルライフ減脂管家',
  'chat.closeSidebar': 'サイドバーを閉じる',
  'chat.defaultTitle': '新しい会話',
  'chat.demoBanner': 'デモモード：未接続。返信はローカルサンプルです。',
  'chat.demoBannerExtra': ' OpenClaw 接続で本物の AI 返信。',
  'chat.demoBannerLink': '設定へ',
  'chat.emptyHint': 'AI ローカルライフ減脂管家 · 下のクイックアクションで会話を始めましょう。',
  'chat.emptyReply': '（返信なし）',
  'chat.emptyTitle': '今日は何を話しましょう？',
  'chat.locating': '位置取得中…',
  'chat.nearbyLoading': '近くのおすすめを検索中…',
  'chat.openHistory': '履歴を開く',
  'chat.placeholderGenerating': '返信中…',
  'chat.placeholderOffline': 'サービス利用不可。設定で再試行してください。',
  'chat.placeholderReady': 'BurnPal に聞く…',
  'chat.scrollToBottom': '下へスクロール',
  'chat.statusOffline': 'オフライン',
  'chat.statusOnline': '軽鹭待機',
  'chat.statusWorking': '軽鹭思考中',
  'chat.stopped': '（生成停止）',
  'composer.send': '送信',
  'composer.stopGenerate': '生成を停止',
  'composer.voiceStart': '音声入力',
  'composer.voiceStop': '音声入力を停止',
  'cuisine.cantonese': '広東',
  'cuisine.japanese': '和食',
  'cuisine.light': '軽食',
  'cuisine.sichuan': '四川',
  'cuisine.vegetarian': 'ベジタリアン',
  'cuisine.western': '洋食',
  'dashboard.calories': '今日のカロリー',
  'dashboard.consumed': '摂取済',
  'dashboard.remaining': '残り',
  'dashboard.setupBtn': '設定する',
  'dashboard.setupHint': '身長・体重・目標を入力してカロリーとトレーニングを解放',
  'dashboard.setupTitle': 'プロフィールを完成',
  'dashboard.training': 'トレーニング',
  'dashboard.weekly': '週間頻度',
  'detail.balanced': 'バランス',
  'detail.carbs': '炭水化物',
  'detail.close': '閉じる',
  'detail.closeSheet': '詳細を閉じる',
  'detail.concise': '簡潔',
  'detail.detailed': '詳細',
  'detail.fat': '脂質',
  'detail.fiber': '食物繊維',
  'detail.gymHint': '来店前に営業時間・設備・クラスを確認。トレーニング後は近くでストレッチ。',
  'detail.navigate': 'ナビ開始',
  'detail.noNavigate': '座標なし — ナビ不可',
  'detail.nutrition': '栄養参考',
  'detail.nutritionHint': 'サンプル推定、店舗実測ではありません',
  'detail.protein': 'タンパク質',
  'detail.recoveryHint': 'トレーニング後の散歩とストレッチに最適。水分補給と混雑回避を。',
  'detail.mapLabel': 'ルート地図',
  'detail.mapLoading': '徒歩ルートを計算中…',
  'detail.routeWalk': '徒歩',
  'detail.routeUnavailable': 'ルート取得不可 — マーカーのみ表示',
  'detail.mapNoOrigin': '位置情報をオンにするとルート表示',
  'detail.youAreHere': '現在地',
  'detail.destination': '目的地',
  'detail.openExternal': '地図アプリで開く',
  'eval.badgeLlm': 'AI 品質',
  'eval.badgeLocal': 'ローカル品質',
  'goal.fat_loss': '科学的減脂',
  'goal.maintain': '体型維持',
  'goal.muscle_gain': '筋肉増量',
  'lang.en': 'English',
  'lang.ja': '日本語',
  'lang.ko': '한국어',
  'lang.zh': '简体中文',
  'meal.aiEstimate': ' · AI 推定',
  'meal.hintAi': 'AI によるカロリー推定',
  'meal.hintRules': 'オフライン推定 — 接続で AI 精算',
  'meal.letterFrom': '軽鹭からの手紙 · {slot}',
  'meal.ok': '了解',
  'meal.openEnvelope': '封筒を開く',
  'meal.placeholder': '例：チキン丼、社食…',
  'meal.recommend.breakfast': '全粒サンド、ゆで卵、無糖豆乳 — 約380kcal。',
  'meal.recommend.dinner': '高タンパク低脂の夕食 — 焼き魚/チキンと野菜。就寝前の油っこいものは避けて。',
  'meal.recommend.low': 'カロリー残りわずか — サラダ、ヨーグルト、無糖豆乳を。',
  'meal.recommend.lunch': 'チキン丼または定食 — 550kcal以内。',
  'meal.recommend.medium': 'グリルチキン丼（約520kcal）または蒸し魚と野菜 — 高タンパク低脂。',
  'meal.recorded': '{kcal} kcal を記録',
  'meal.remainingIntake': 'あと {remaining} kcal',
  'meal.reminderBody': '食べたものを記録 — 軽鹭がカロリー推定。今日あと約 {remaining} kcal。',
  'meal.reminderTitle': '{slot}の時間です',
  'meal.ruleEstimate': ' · ルール推定',
  'meal.slot.breakfast': '朝食',
  'meal.slot.dinner': '夕食',
  'meal.slot.lunch': '昼食',
  'meal.slotDefault': '食事',
  'meal.submit': '記録してカロリー推定',
  'meal.submitting': 'AI 推定中…',
  'meal.todayConsumed': ' · 今日 {consumed} kcal',
  'meal.whatDidYouEat': '{slot}に何を食べました？',
  'profile.activity': '活動量',
  'profile.activityActive': '高い',
  'profile.activityLight': '軽い',
  'profile.activityModerate': '中程度',
  'profile.activitySedentary': '座りがち',
  'profile.age': '年齢',
  'profile.avoid': '避けたいもの',
  'profile.cuisines': '好きな料理',
  'profile.dailyTarget': '1日 {kcal} kcal · タンパク質 {protein}g · {session}',
  'profile.height': '身長 (cm)',
  'profile.hint': '身体データと目標を入力 — 軽鹭がカロリーとトレーニングを設定。',
  'profile.nickname': 'ニックネーム',
  'profile.save': '保存してプラン更新',
  'profile.savedToast': 'プロフィール保存 — カロリーとトレーニング更新',
  'profile.sex': '性別',
  'profile.sexFemale': '女性',
  'profile.sexMale': '男性',
  'profile.sexSelect': '選択',
  'profile.title': '減脂プロフィール · トレーニング',
  'profile.validationMissing': '身長・体重・目標を入力してください',
  'profile.weight': '体重 (kg)',
  'quick.customPlan': '今日のプランを作成',
  'quick.defaultHint': 'タップして相談',
  'quick.eat.label': '何を食べる',
  'quick.eat.prompt': '今日仕事後に何を食べるのが良い？',
  'quick.move.label': '一緒に動く',
  'quick.move.prompt': '今日の運動プランを組んで',
  'quick.recover.label': 'リカバリー',
  'quick.recover.prompt': '脚の日が終わった。ストレッチと回復を提案して',
  'quick.train.label': 'どこで鍛える',
  'quick.train.prompt': '近くの筋トレジムを探して',
  'rail.badgePlan': '思考',
  'rail.badgeReply': '返信',
  'rail.badgeScene': 'シーン',
  'rail.confidence': '信頼度',
  'rail.hintExecuting': '回答を整理中…',
  'rail.hintScoring': '回答生成完了 — 軽鹭が品質を確認中…',
  'richCard.viewDetail': '詳細を見る',
  'settings.aiDetail': '詳細度',
  'settings.aiEmoji': '絵文字を使う',
  'settings.aiNearby': '近くのおすすめを優先',
  'settings.aiPrefs': 'AI 回答設定',
  'settings.aiTone': '口調',
  'settings.dev.accessKey': 'アクセストークン',
  'settings.dev.activeConfig': '現在有効',
  'settings.dev.apiBaseUrl': 'API ベース URL',
  'settings.dev.availableModels': '利用可能なモデル',
  'settings.dev.checking': '確認中',
  'settings.dev.connected': 'オンライン',
  'settings.dev.connectionLabel': 'サービス状態',
  'settings.dev.defaultConfig': 'デフォルト設定',
  'settings.dev.error': '接続エラー',
  'settings.dev.idle': '未確認',
  'settings.dev.model': 'モデル',
  'settings.dev.modelId': 'モデル ID',
  'settings.dev.notConfigured': '未設定',
  'settings.dev.ready': '軽鹭オンライン',
  'settings.dev.reset': 'デフォルトに戻す',
  'settings.dev.save': '設定を保存',
  'settings.dev.testConnection': '接続テスト',
  'settings.dev.token': 'キー',
  'settings.dev.waiting': '接続できません',
  'settings.developer': 'Developer',
  'settings.developerAria': 'Developer',
  'settings.language': '言語',
  'settings.location': '位置情報',
  'settings.locationDenied': '位置情報の許可が拒否されました',
  'settings.locationOff': '位置情報オフ',
  'settings.locationSourceGps': 'GPS 定位',
  'settings.locationSourceIp': 'IP 定位',
  'settings.locationUnavailable': '位置を取得できません',
  'settings.mealReminders': '食事リマインダー',
  'settings.privacy': 'プライバシーと通知',
  'settings.saved': '保存しました',
  'settings.theme': 'テーマ',
  'settings.themeDark': 'ダーク',
  'settings.themeLight': 'ライト',
  'settings.account': 'アカウントとクラウド同期',
  'settings.accountHint': 'ログイン後、プロフィール・一緒に動く・食事記録・会話履歴を自動同期',
  'settings.accountLogin': 'ログイン / 登録',
  'settings.accountManage': 'アカウント管理',
  'settings.accountSyncing': '同期中…',
  'settings.title': '設定',
  'sidebar.about': 'について',
  'sidebar.badgeCurrent': '現在',
  'sidebar.current': '現在の会話',
  'sidebar.deleteConversation': '会話を削除 {title}',
  'sidebar.history': '履歴',
  'sidebar.newChat': '新しいチャット',
  'sidebar.noConversation': '会話がありません',
  'sidebar.noHistory': '履歴なし',
  'sidebar.previewFallback': '軽鹭と話し始めましょう…',
  'sidebar.settings': '設定',
  'sidebar.yiqidong': '一緒に動く',
  'splash.badge1': 'バレー · 有酸素',
  'splash.badge2': '近くの施設',
  'splash.badge3': 'AI トレーニング',
  'splash.accountLoggedInBadge': 'ログイン済み · クラウド同期中',
  'splash.accountTitle': '登録 / ログイン · クラウド同期',
  'splash.backToHome': 'ホームに戻る',
  'splash.headline1': '軽やかに、',
  'splash.headline2': '楽しく生きる',
  'splash.heroAlt': '軽鹭 · バレーシーン',
  'splash.subtitle': '軽鹭と食事・カロリー・運動について話そう',
  'splash.tagline': 'スマートローカル · 24時間 AI 減脂管家',
  'splash.wakeBtn': '管家を起動',
  'toast.connectionOk': '接続成功 — 軽鹭準備完了',
  'toast.conversationDeleted': '会話を削除しました',
  'toast.conversationDeletedNew': '新しい会話を開始しました',
  'toast.developerUnlocked': '開発者モード有効',
  'toast.editingResend': '新しい返信を生成中…',
  'toast.feedbackImprove': 'フィードバックありがとう。軽鹭は改善を続けます。',
  'toast.feedbackThanks': 'フィードバックありがとう！',
  'toast.needConnection': '接続してから会話を開始してください',
  'toast.newConversation': '新しい会話を開始',
  'toast.regenerating': '再生成中…',
  'toast.sendFailed': '送信失敗 — 後でもう一度',
  'toast.settingsReset': 'デフォルトに戻しました',
  'toast.stopped': '生成を停止しました',
  'toast.voiceListening': '聞いています…',
  'toast.voiceStarted': '音声入力開始。話してください',
  'toast.voiceUnsupported': '音声入力には Chrome または Edge が必要です',
  'toast.yiqidongSaved': '一緒に動く保存 · {summary}',
  'tone.coach': 'コーチ型',
  'tone.friendly': '親しみやすい',
  'tone.professional': 'プロフェッショナル',
  'typing.thinking': '軽鹭が考えています',
  'yiqidong.addTime': '時間を追加',
  'yiqidong.back': '戻る',
  'yiqidong.casual': '気まま通知',
  'yiqidong.casualBadge': '気まま',
  'yiqidong.casualHint': '天気と空気が良いときだけ、たまに通知',
  'yiqidong.describe.casual': '気まま · 1日最大 {count} 回',
  'yiqidong.describe.custom': '{days} {times}',
  'yiqidong.describe.daily': '毎日 {times}',
  'yiqidong.describe.fallback': '固定 {times}',
  'yiqidong.describe.interval': '{days} 日ごと {times}',
  'yiqidong.describe.off': 'オフ',
  'yiqidong.describe.weekly': '毎週 {times}',
  'yiqidong.heroLabel': '運動リマインダー',
  'yiqidong.inbox': '受信箱',
  'yiqidong.intervalDays': '間隔日数',
  'yiqidong.letterAck': '了解',
  'yiqidong.letterShaking': '軽鹭から手紙が…',
  'yiqidong.letterSignOff': '—— 軽鹭',
  'yiqidong.maxPerDay': '1日最大',
  'yiqidong.modalAria': '一緒に動く受信箱',
  'yiqidong.modeLabel': 'リマインダー方式',
  'yiqidong.noLetters': '手紙なし — 設定でリマインダーを有効に',
  'yiqidong.off': 'オフ',
  'yiqidong.offHint': '運動リマインダーは送りません',
  'yiqidong.offSummary': 'オフ',
  'yiqidong.pickDays': '曜日を選択',
  'yiqidong.pickLetter': '手紙を選んで読む',
  'yiqidong.preview': '現在の設定',
  'yiqidong.questAccept': '見る',
  'yiqidong.questCasualTitle': '気ままタスク',
  'yiqidong.questEyebrow': '新しいクエスト',
  'yiqidong.questLater': '後で',
  'yiqidong.questScheduledTitle': '運動クエスト',
  'yiqidong.remove': '削除',
  'yiqidong.repeat': '繰り返し',
  'yiqidong.repeat.custom': '曜日指定',
  'yiqidong.repeat.daily': '毎日',
  'yiqidong.repeat.interval': 'N 日ごと',
  'yiqidong.repeat.weekly': '毎週',
  'yiqidong.reset': 'デフォルト',
  'yiqidong.save': '保存',
  'yiqidong.scheduled': '固定リマインダー',
  'yiqidong.scheduledBadge': 'リマインダー',
  'yiqidong.scheduledHint': '設定した時間・周期で運動提案を通知',
  'yiqidong.settingsIntro': '方式を選んで保存すると、軽鹭がリマインダーを送ります。',
  'yiqidong.settingsTab': '設定',
  'yiqidong.times': 'リマインダー時間',
  'yiqidong.timesOnce': '1 回',
  'yiqidong.timesThrice': '3 回',
  'yiqidong.timesTwice': '2 回',
  'yiqidong.title': '一緒に動く',
  'yiqidong.weekday.fri': '金',
  'yiqidong.weekday.mon': '月',
  'yiqidong.weekday.sat': '土',
  'yiqidong.weekday.sun': '日',
  'yiqidong.weekday.thu': '木',
  'yiqidong.weekday.tue': '火',
  'yiqidong.weekday.wed': '水',
}

const KO: Record<MessageKey, string> = {
  'about.description': 'OpenClaw 기반 로컬 감량 파트너 — 실제 상황에서 실행 가능한 식단·운동 조언.',
  'about.hackathon': '美団 해커톤 트랙 1',
  'about.title': '정보',
  'about.version': 'BurnPal v1.0',
  'auth.backToChat': '채팅으로',
  'auth.accountMenu': '계정 관리',
  'auth.backendUnavailable': '백엔드에 연결할 수 없습니다. backend에서 npm run dev를 실행하세요',
  'auth.codeRequired': '인증 코드를 입력하세요',
  'auth.codeHint': '이메일 입력 후 해당 주소로 6자리 코드가 자동 전송됩니다',
  'auth.codeSent': '인증 코드를 보냈습니다. 이메일을 확인하세요',
  'auth.codeSentTo': '인증 코드를 {email}(으)로 보냈습니다. 이메일을 확인하세요',
  'auth.displayName': '닉네임',
  'auth.displayNamePlaceholder': '선택',
  'auth.email': '이메일',
  'auth.failed': '실패했습니다. 다시 시도하세요',
  'auth.invalidEmailForCode': '유효한 이메일을 먼저 입력하세요',
  'auth.resendCode': '{seconds}초 후 재전송',
  'auth.sendCode': '코드 보내기',
  'auth.sendingCode': '인증 코드 전송 중…',
  'auth.verificationCode': '인증 코드',
  'auth.verificationCodePlaceholder': '6자리 숫자',
  'auth.intro': '로그인하면 프로필·함께 운동·식사 기록·대화 기록 등이 클라우드에 동기화됩니다.',
  'auth.loggedInAs': '로그인됨',
  'auth.loginSuccess': '로그인 완료 — 동기화됨',
  'auth.loginSubmit': '로그인',
  'auth.loginTab': '로그인',
  'auth.logout': '로그아웃',
  'auth.logoutSuccess': '로그아웃됨',
  'auth.password': '비밀번호',
  'auth.registerIntro': '가입 이메일을 입력하면 해당 주소로 인증 코드가 자동 전송됩니다. 인증 후 가입 및 클라우드 동기화가 활성화됩니다.',
  'auth.registerSubmit': '가입',
  'auth.registerSuccess': '가입 완료 — 로컬 데이터 업로드됨',
  'auth.registerTab': '가입',
  'auth.submitting': '처리 중…',
  'auth.syncing': '동기화 중…',
  'auth.title': '계정',
  'action.back': '뒤로',
  'action.cancel': '취소',
  'action.close': '닫기',
  'action.copied': '복사됨',
  'action.copy': '복사',
  'action.edit': '편집',
  'action.editHint': 'Ctrl+Enter 전송 · Esc 취소',
  'action.editTitle': '질문 편집',
  'action.helpful': '도움됨',
  'action.helpfulMarked': '도움됨 표시',
  'action.improve': '개선 필요',
  'action.improveMarked': '개선 필요 표시',
  'action.regenerate': '재생성',
  'action.regenerating': '생성 중…',
  'action.retry': '재시도',
  'action.saveSend': '저장 후 전송',
  'avoid.alcohol': '알코올',
  'avoid.fried': '튀김',
  'avoid.organ': '내장',
  'avoid.sugar': '고당',
  'brand.tagline': 'AI 로컬 라이프스타일 감량 매니저',
  'chat.closeSidebar': '사이드바 닫기',
  'chat.defaultTitle': '새 대화',
  'chat.demoBanner': '데모 모드: 미연결. 응답은 로컬 샘플입니다.',
  'chat.demoBannerExtra': ' OpenClaw 연결 시 실제 AI 답변.',
  'chat.demoBannerLink': '설정 열기',
  'chat.emptyHint': 'AI 로컬 라이프스타일 감량 매니저 · 아래 빠른 실행으로 대화를 시작하세요.',
  'chat.emptyReply': '(답변 없음)',
  'chat.emptyTitle': '오늘 무엇을 이야기할까요?',
  'chat.locating': '위치 확인 중…',
  'chat.nearbyLoading': '근처 추천을 찾는 중…',
  'chat.openHistory': '대화 기록 열기',
  'chat.placeholderGenerating': '답변 중…',
  'chat.placeholderOffline': '서비스를 사용할 수 없습니다. 설정에서 다시 시도하세요.',
  'chat.placeholderReady': 'BurnPal에게 물어보기…',
  'chat.scrollToBottom': '아래로 스크롤',
  'chat.statusOffline': '오프라인',
  'chat.statusOnline': '경록 대기',
  'chat.statusWorking': '경록 생각 중',
  'chat.stopped': '(생성 중지됨)',
  'composer.send': '전송',
  'composer.stopGenerate': '생성 중지',
  'composer.voiceStart': '음성 입력',
  'composer.voiceStop': '음성 입력 중지',
  'cuisine.cantonese': '광동',
  'cuisine.japanese': '일식',
  'cuisine.light': '라이트 푸드',
  'cuisine.sichuan': '사천',
  'cuisine.vegetarian': '채식',
  'cuisine.western': '양식',
  'dashboard.calories': '오늘 칼로리',
  'dashboard.consumed': '섭취',
  'dashboard.remaining': '남음',
  'dashboard.setupBtn': '설정하기',
  'dashboard.setupHint': '키·몸무게·목표를 입력해 칼로리와 운동 계획을 잠금 해제',
  'dashboard.setupTitle': '프로필 완성',
  'dashboard.training': '운동 계획',
  'dashboard.weekly': '주간 빈도',
  'detail.balanced': '균형',
  'detail.carbs': '탄수화물',
  'detail.close': '닫기',
  'detail.closeSheet': '상세 닫기',
  'detail.concise': '간결',
  'detail.detailed': '상세',
  'detail.fat': '지방',
  'detail.fiber': '식이섬유',
  'detail.gymHint': '방문 전 영업시간·장비·수업 확인. 운동 후 근처 회복 장소에서 스트레칭.',
  'detail.navigate': '내비게이션',
  'detail.noNavigate': '좌표 없음 — 내비 불가',
  'detail.nutrition': '영양 참고',
  'detail.nutritionHint': '샘플 추정, 매장 실측 아님',
  'detail.protein': '단백질',
  'detail.recoveryHint': '운동 후 산책·정적 스트레칭에 적합. 수분 보충·혼잡 시간 피하기.',
  'detail.mapLabel': '경로 지도',
  'detail.mapLoading': '도보 경로 계산 중…',
  'detail.routeWalk': '도보',
  'detail.routeUnavailable': '경로를 가져올 수 없음 — 마커만 표시',
  'detail.mapNoOrigin': '위치 서비스를 켜면 경로 표시',
  'detail.youAreHere': '내 위치',
  'detail.destination': '목적지',
  'detail.openExternal': '지도 앱에서 열기',
  'eval.badgeLlm': 'AI 품질',
  'eval.badgeLocal': '로컬 품질',
  'goal.fat_loss': '과학적 감량',
  'goal.maintain': '체형 유지',
  'goal.muscle_gain': '근육 증가',
  'lang.en': 'English',
  'lang.ja': '日本語',
  'lang.ko': '한국어',
  'lang.zh': '简体中文',
  'meal.aiEstimate': ' · AI 추정',
  'meal.hintAi': 'AI로 칼로리 추정',
  'meal.hintRules': '오프라인 추정 — 연결 시 AI 정밀 계산',
  'meal.letterFrom': '경록의 편지 · {slot}',
  'meal.ok': '확인',
  'meal.openEnvelope': '봉투 열기',
  'meal.placeholder': '예: 닭가슴살 볼, 구내식당…',
  'meal.recommend.breakfast': '통밀 샌드위치, 삶은 달걀, 무가당 두유 — 약 380kcal.',
  'meal.recommend.dinner': '고단백 저지방 저녁 — 구운 생선/닭가슴살·채소. 취침 전 기름진 음식 피하기.',
  'meal.recommend.low': '칼로리 여유 적음 — 샐러드, 그릭 요거트, 무가당 두유 추천.',
  'meal.recommend.lunch': '닭가슴살 볼 또는 일식 정식 — 550kcal 이내.',
  'meal.recommend.medium': '구운 닭가슴살 볼(~520kcal) 또는 찜 생선·채소 — 고단백 저지방.',
  'meal.recorded': '{kcal} kcal 기록',
  'meal.remainingIntake': '{remaining} kcal 남음',
  'meal.reminderBody': '먹은 것 기록 — 경록이 칼로리 추정. 오늘 약 {remaining} kcal 남음.',
  'meal.reminderTitle': '{slot} 시간입니다',
  'meal.ruleEstimate': ' · 규칙 추정',
  'meal.slot.breakfast': '아침',
  'meal.slot.dinner': '저녁',
  'meal.slot.lunch': '점심',
  'meal.slotDefault': '식사',
  'meal.submit': '기록 및 칼로리 추정',
  'meal.submitting': 'AI 추정 중…',
  'meal.todayConsumed': ' · 오늘 {consumed} kcal',
  'meal.whatDidYouEat': '{slot}에 무엇을 드셨나요?',
  'profile.activity': '활동량',
  'profile.activityActive': '높음',
  'profile.activityLight': '가벼움',
  'profile.activityModerate': '보통',
  'profile.activitySedentary': '거의 없음',
  'profile.age': '나이',
  'profile.avoid': '피할 것',
  'profile.cuisines': '선호 요리',
  'profile.dailyTarget': '일일 {kcal} kcal · 단백질 {protein}g · {session}',
  'profile.height': '키 (cm)',
  'profile.hint': '신체 데이터와 목표 입력 — 경록이 칼로리·운동 계획 생성.',
  'profile.nickname': '닉네임',
  'profile.save': '저장 및 계획 업데이트',
  'profile.savedToast': '프로필 저장 — 칼로리·운동 계획 생성',
  'profile.sex': '성별',
  'profile.sexFemale': '여',
  'profile.sexMale': '남',
  'profile.sexSelect': '선택',
  'profile.title': '감량 프로필 · 운동 계획',
  'profile.validationMissing': '키, 몸무게, 목표를 입력하세요',
  'profile.weight': '몸무게 (kg)',
  'quick.customPlan': '오늘 맞춤 계획',
  'quick.defaultHint': '탭하여 문의',
  'quick.eat.label': '무엇을 먹을까',
  'quick.eat.prompt': '오늘 퇴근 후 뭐 먹을까?',
  'quick.move.label': '함께 운동',
  'quick.move.prompt': '오늘 운동 계획 짜줘',
  'quick.recover.label': '회복하기',
  'quick.recover.prompt': '오늘 하체 운동 끝. 스트레칭·회복 조언해줘',
  'quick.train.label': '어디서 운동',
  'quick.train.prompt': '근처 근력 운동 헬스장 찾아줘',
  'rail.badgePlan': '사고',
  'rail.badgeReply': '답변',
  'rail.badgeScene': '장면',
  'rail.confidence': '신뢰도',
  'rail.hintExecuting': '답변 정리 중…',
  'rail.hintScoring': '답변 생성 완료 — 경록이 품질 확인 중…',
  'richCard.viewDetail': '상세 보기',
  'settings.aiDetail': '상세도',
  'settings.aiEmoji': '이모지 사용',
  'settings.aiNearby': '근처 추천 우선',
  'settings.aiPrefs': 'AI 응답 설정',
  'settings.aiTone': '어조',
  'settings.dev.accessKey': '액세스 토큰',
  'settings.dev.activeConfig': '현재 적용',
  'settings.dev.apiBaseUrl': 'API 기본 URL',
  'settings.dev.availableModels': '사용 가능한 모델',
  'settings.dev.checking': '확인 중',
  'settings.dev.connected': '온라인',
  'settings.dev.connectionLabel': '서비스 상태',
  'settings.dev.defaultConfig': '기본 설정',
  'settings.dev.error': '연결 오류',
  'settings.dev.idle': '미확인',
  'settings.dev.model': '모델',
  'settings.dev.modelId': '모델 ID',
  'settings.dev.notConfigured': '미설정',
  'settings.dev.ready': '경록 온라인',
  'settings.dev.reset': '기본값 복원',
  'settings.dev.save': '설정 저장',
  'settings.dev.testConnection': '연결 테스트',
  'settings.dev.token': '키',
  'settings.dev.waiting': '연결 불가',
  'settings.developer': 'Developer',
  'settings.developerAria': 'Developer',
  'settings.language': '언어',
  'settings.location': '위치 서비스',
  'settings.locationDenied': '위치 권한 거부됨',
  'settings.locationOff': '위치 서비스 꺼짐',
  'settings.locationSourceGps': 'GPS 위치',
  'settings.locationSourceIp': 'IP 위치',
  'settings.locationUnavailable': '위치를 가져올 수 없음',
  'settings.mealReminders': '식사 알림',
  'settings.privacy': '개인정보 및 알림',
  'settings.saved': '저장됨',
  'settings.theme': '테마',
  'settings.themeDark': '다크',
  'settings.themeLight': '라이트',
  'settings.account': '계정 및 클라우드 동기화',
  'settings.accountHint': '로그인 시 프로필·함께 운동·식사 기록·대화 기록 자동 동기화',
  'settings.accountLogin': '로그인 / 가입',
  'settings.accountManage': '계정 관리',
  'settings.accountSyncing': '동기화 중…',
  'settings.title': '설정',
  'sidebar.about': '정보',
  'sidebar.badgeCurrent': '현재',
  'sidebar.current': '현재 대화',
  'sidebar.deleteConversation': '대화 삭제 {title}',
  'sidebar.history': '기록',
  'sidebar.newChat': '새 대화',
  'sidebar.noConversation': '대화 없음',
  'sidebar.noHistory': '기록 없음',
  'sidebar.previewFallback': '경록과 대화를 시작하세요…',
  'sidebar.settings': '설정',
  'sidebar.yiqidong': '함께 운동',
  'splash.badge1': '배구 · 유산소',
  'splash.badge2': '근처 시설 추천',
  'splash.badge3': 'AI 운동 계획',
  'splash.accountLoggedInBadge': '로그인됨 · 클라우드 동기화 중',
  'splash.accountTitle': '가입 / 로그인 · 클라우드 동기화',
  'splash.backToHome': '홈으로',
  'splash.headline1': '가볍게,',
  'splash.headline2': '즐겁게 살기',
  'splash.heroAlt': '경록 · 배구 장면',
  'splash.subtitle': '경록과 식사·칼로리·운동 이야기',
  'splash.tagline': '스마트 로컬 · 24시간 AI 감량 매니저',
  'splash.wakeBtn': '매니저 깨우기',
  'toast.connectionOk': '연결 성공 — 경록 준비 완료',
  'toast.conversationDeleted': '대화 삭제됨',
  'toast.conversationDeletedNew': '새 대화를 시작했습니다',
  'toast.developerUnlocked': '개발자 모드 활성화',
  'toast.editingResend': '새 답변 생성 중…',
  'toast.feedbackImprove': '피드백 감사합니다. 경록이 계속 개선하겠습니다.',
  'toast.feedbackThanks': '피드백 감사합니다!',
  'toast.needConnection': '연결 후 대화를 시작하세요',
  'toast.newConversation': '새 대화 시작',
  'toast.regenerating': '재생성 중…',
  'toast.sendFailed': '전송 실패 — 나중에 다시 시도',
  'toast.settingsReset': '기본 설정 복원',
  'toast.stopped': '생성 중지됨',
  'toast.voiceListening': '듣는 중…',
  'toast.voiceStarted': '음성 입력 시작. 말씀해 주세요',
  'toast.voiceUnsupported': '음성 입력은 Chrome 또는 Edge가 필요합니다',
  'toast.yiqidongSaved': '함께 운동 저장 · {summary}',
  'tone.coach': '코치형',
  'tone.friendly': '친근함',
  'tone.professional': '전문적',
  'typing.thinking': '경록이 생각 중',
  'yiqidong.addTime': '시간 추가',
  'yiqidong.back': '뒤로',
  'yiqidong.casual': '자유 알림',
  'yiqidong.casualBadge': '자유',
  'yiqidong.casualHint': '날씨·공기가 좋을 때 가끔 알림',
  'yiqidong.describe.casual': '자유 · 하루 최대 {count}회',
  'yiqidong.describe.custom': '{days} {times}',
  'yiqidong.describe.daily': '매일 {times}',
  'yiqidong.describe.fallback': '고정 {times}',
  'yiqidong.describe.interval': '{days}일마다 {times}',
  'yiqidong.describe.off': '꺼짐',
  'yiqidong.describe.weekly': '매주 {times}',
  'yiqidong.heroLabel': '운동 알림',
  'yiqidong.inbox': '받은편지함',
  'yiqidong.intervalDays': '간격 일수',
  'yiqidong.letterAck': '알겠습니다',
  'yiqidong.letterShaking': '경록의 편지가…',
  'yiqidong.letterSignOff': '—— 경록',
  'yiqidong.maxPerDay': '하루 최대',
  'yiqidong.modalAria': '함께 운동 받은편지함',
  'yiqidong.modeLabel': '알림 방식',
  'yiqidong.noLetters': '편지 없음 — 설정에서 알림 켜기',
  'yiqidong.off': '끄기',
  'yiqidong.offHint': '운동 알림을 받지 않습니다',
  'yiqidong.offSummary': '꺼짐',
  'yiqidong.pickDays': '요일 선택',
  'yiqidong.pickLetter': '편지를 선택해 읽기',
  'yiqidong.preview': '현재 설정',
  'yiqidong.questAccept': '보기',
  'yiqidong.questCasualTitle': '자유 퀘스트',
  'yiqidong.questEyebrow': '새 퀘스트',
  'yiqidong.questLater': '나중에',
  'yiqidong.questScheduledTitle': '운동 퀘스트',
  'yiqidong.remove': '제거',
  'yiqidong.repeat': '반복',
  'yiqidong.repeat.custom': '요일 지정',
  'yiqidong.repeat.daily': '매일',
  'yiqidong.repeat.interval': 'N일마다',
  'yiqidong.repeat.weekly': '매주',
  'yiqidong.reset': '기본값',
  'yiqidong.save': '저장',
  'yiqidong.scheduled': '고정 알림',
  'yiqidong.scheduledBadge': '알림',
  'yiqidong.scheduledHint': '설정한 시간·주기로 운동 제안 알림',
  'yiqidong.settingsIntro': '방식을 선택하고 저장하면 경록이 알림을 보냅니다.',
  'yiqidong.settingsTab': '설정',
  'yiqidong.times': '알림 시간',
  'yiqidong.timesOnce': '1회',
  'yiqidong.timesThrice': '3회',
  'yiqidong.timesTwice': '2회',
  'yiqidong.title': '함께 운동',
  'yiqidong.weekday.fri': '금',
  'yiqidong.weekday.mon': '월',
  'yiqidong.weekday.sat': '토',
  'yiqidong.weekday.sun': '일',
  'yiqidong.weekday.thu': '목',
  'yiqidong.weekday.tue': '화',
  'yiqidong.weekday.wed': '수',
}

export const MESSAGES: Record<AppLocale, Record<MessageKey, string>> = {
  zh: ZH,
  en: EN,
  ja: JA,
  ko: KO,
}

export function translate(
  locale: AppLocale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  let text = MESSAGES[locale][key] ?? MESSAGES.zh[key] ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}