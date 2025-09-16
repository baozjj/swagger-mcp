import { formProps } from '@/components/Form/src/props'
import { TableSchema } from './type'
import type { PropType } from 'vue'
import { ElTable } from 'element-plus'
export const tableProps = {
	...ElTable.props,
	// 表格数据请求后的钩子函数
	afterQuery: {
		type: Function,
		default: null
	},
	// 额外参数，会在post请求接口时带在url上
	extraParams: {
		type: Object,
		default: () => ({})
	},
	// 是否显示表格工具栏
	noTableTools: {
		type: Boolean,
		default: false
	},
	// 表格loading
	loading: {
		type: Boolean,
		default: false
	},
	// 表格数据，如果传了这个参数，就不会请求接口
	tableData: {
		type: Array,
		default: () => []
	},
	// 请求接口路径
	requestUrl: {
		type: String,
		default: ''
	},
	// 导出下载接口路径
	downloadUrl: {
		type: String,
		default: ''
	},
	// 请求接口方法
	requestMethod: {
		type: String as PropType<'get' | 'post'>,
		default: 'get'
	},
	// 表格配置
	tableSchema: {
		type: Array as PropType<TableSchema[]>,
		default: () => []
	},
	// 是否显示操作列
	operation: {
		type: Boolean,
		default: false
	},
	// 操作列宽度
	operationWidth: {
		type: [Number, String],
		default: 200
	},
	// 是否显示分页
	showPagination: {
		type: Boolean,
		default: true
	},
	// 是否显示选择列
	showSelection: {
		type: Boolean,
		default: false
	},
	// 是否为单选
	radio: {
		type: Boolean,
		default: false
	},
	border: {
		type: Boolean,
		default: false
	},
	stripe: {
		type: Boolean,
		default: true
	},
	maxHeight: {
		type: [Number, String],
		default: null
	},
	selectable: {
		type: Function as PropType<(row: any, index: number) => boolean>,
		default: () => true
	},
	// 是否显示列设置
	setting: {
		type: Boolean,
		default: false
	},
	// 是否显示序号列
	showIndex: {
		type: Boolean,
		default: false
	},
	// 导出下载时使用的模板code
	downloadTemplateCode: {
		type: String,
		default: ''
	},
	// 导出下载时的权限编码,为noAuth时不需要权限
	downloadAuthority: {
		type: String,
		default: ''
	},
	// 大表导出默认限制天数
	downloadLimitMaxDays: {
		type: Number,
		default: 90
	},
	// 表格存储localStorage的key,默认为当前路由的name
	tableName: {
		type: String,
		default: ''
	},
	// 是否使用本地存储表格配置
	useStorage: {
		type: Boolean,
		default: false
	},
	// 是否需要数据索引
	needDataIndex: {
		type: Boolean,
		default: false
	},
	pageSizes: {
		type: Array<number>,
		default: () => [20, 30, 50, 100]
	},
	defaultPageSize: {
		type: Number,
		default: 20
	}
}
export const formTableProps = {
	...formProps,
	...tableProps
}
