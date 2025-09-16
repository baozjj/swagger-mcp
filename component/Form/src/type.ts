export interface IOptions {
	label?: string
	value?: string
	disabled?: boolean
	defaultValue?: [] | [Date, Date] | string | number // 设置对应prop的默认值
	ignore?: boolean // 此字段是否忽略大表限制
	[key: string]: any
}
export interface FormSchema {
	/*  表单项字段 */
	prop: string
	// 表单项标题
	label: string
	// 表单项类型
	type: any
	// 表单项校验规则
	rules?: any[]
	// 表单项是否过滤
	filterFun?: any
	// querySelect类型的url
	url?: string
	// select是否支持多选
	multiple?: boolean
	collapseTags?: boolean
	// 默认值
	defaultValue?: any
	// prepend宽度
	prependWidth?: string
	// prepend选项
	prependOptions?: IOptions[]
	// 参数函数，联动整个表单
	paramsFun?: any
	// querySelect url参数
	params?: object
	// 手机号码区号
	prefix: string
	// 手机号码区号默认值
	defaultPrefix?: string
	// 是否逗号拼接数组，针对select多选
	spliceCommas?: boolean
	// 时间格式化类型，YYYY-MM-DD 参考dayjs format即可
	timeFormat?: string
	maxRange?: number // 限制最大选择区间
	clearable?: boolean // 是否可清除
	// 此配置解决大表优化，必传时间限制。 当该字段有值，可清空日期的字段，仅支持daterange，selectDatetimerange，datetimerange
	clearableProps?: string[]
	// 该字段是否执行下载最大日期限制，仅支持daterange，selectDatetimerange，datetimerange
	isDownloadLimit?: boolean
	// 当设置目标字段有值时，自动清除默认值,用于页面带参查询时，清除默认值
	autoClearProps?: string[]
	// 日期选择器可选日期截止日期, 仅支持daterange，selectDatetimerange，datetimerange,默认值为今天，1为明天，-1为昨天
	daysFromToday?: number
	// 额外参数，供销售组件使用
	extraProp: any
	// 默认选择第一项
	defaultSelectFirst: boolean
	// 是否是前置条件，等待接口响应完成，执行表单查询操作
	isPrecondition: boolean
	[key: string]: any
}
