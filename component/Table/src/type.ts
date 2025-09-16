export type FormatType = 'date' | 'time' | 'dateFullTime' | 'dict' | 'amount'
export type Fixed = undefined | 'left' | 'right'
export interface CustomKey {
	label: string
	value: string
}
export interface TableSchema {
	label: string
	prop: string
	url?: string | string[]
	minWidth?: number | string
	width?: number | string
	type?: FormatType // 格式化类型
	refresh?: boolean // 是否刷新
	params?: any // querySelect参数
	customKey?: CustomKey // 自定义key
	localOptions?: any[] // 本地数据
	isShow?: boolean // 是否显示
	fixed?: Fixed // 是否固定
	multiple?: boolean // 字典类型是否多值转换
	emptyText?: string // 空值显示
	needLabel?: boolean // 是否需要字典转化后的值
	_dictMap?: any // 临时数据字典map,组件内部使用
	format?: any // 自定义格式化，简单的文本格式化可避免插槽操作
}
