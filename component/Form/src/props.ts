import { propTypes } from '@/utils/propTypes'
import type { PropType } from 'vue'
import type { FormSchema } from './type'
import { ElSelect } from 'element-plus'
import { ElInput } from 'element-plus'
export const querySelectProps = {
	...ElSelect.props,
	// 是否可筛选
	filterable: propTypes.bool.def(false),
	// 是否可清除
	clearable: propTypes.bool.def(false),
	// 禁用组件
	disabled: propTypes.bool.def(false),
	// 是否多选
	multiple: propTypes.bool.def(false),
	// modelValue
	modelValue: propTypes.oneOfType([propTypes.string, propTypes.array, propTypes.number]).def(''),
	// 数据字典请求url,基于base服务可直接传入name
	url: propTypes.oneOfType([propTypes.string, propTypes.array]).def(''),
	// 数据字典请求参数
	params: propTypes.object.def(() => ({})),
	// 作详情展示
	detail: propTypes.bool.def(false),
	// 是否自动查询
	auto: propTypes.bool.def(true),
	// 禁用项
	disabledFun: propTypes.func.def(() => false),
	// 自定义name,属于拓展属性,主要用于禁用函数和过滤函数,常传入后端【prop】关键字(共用函数时,区分不同组件)
	customName: propTypes.string.def(''),
	// 过滤项,与filterFun替换filterFn
	filterFn: propTypes.func.def(list => list),
	// 自定义选项
	customKey: propTypes.object.def(() => ({ label: 'label', value: 'value' })),
	// 强制更新，不适用缓存
	dynamicUpdate: propTypes.bool.def(false),
	// form表单对象
	formModel: propTypes.object.def(() => ({})),
	// 本地数据字典
	localOptions: propTypes.array.def(() => []),
	// 是否显示全部选项
	showAllOption: propTypes.bool.def(false),
	// 全部选项value 值
	allOptionValue: propTypes.string.def(''),
	// 追加方式 push unshift
	addMoreType: propTypes.oneOf(['push', 'unshift']).def('push'),
	// 追加项
	addMoreOptions: propTypes.array.def(() => []),
	// 远程搜索关系词
	remoteKeyword: propTypes.string.def('keyword'),
	// 默认选中第一条
	defaultSelectFirst: propTypes.oneOfType([propTypes.bool, propTypes.func]).def(false),
	// 是否等待接口返回后执行form 表单查询
	waitQuery: propTypes.bool.def(false)
}
// form表单配置
export const formProps = {
	// 表单loading
	loading: {
		type: Boolean,
		default: false
	},
	// 表单配置
	formSchema: {
		type: Array as PropType<FormSchema[]>,
		default: () => []
	},
	// 校验规则
	rules: {
		type: Object,
		default: () => ({})
	},
	// 额外参数
	extraParams: {
		type: Object,
		default: () => ({})
	},
	//初始化参数
	initParams: {
		type: Object,
		default: () => ({})
	},
	// 是否自动查询
	autoQuery: {
		type: Boolean,
		default: true
	},
	// 查询前的前置函数
	beforeQuery: {
		type: Function as PropType<(params: any) => object>,
		default: null
	},
	// 是否格式化接口参数时间
	formatDateTime: {
		type: Boolean,
		default: true
	},
	// 是否默认展开
	defaultExpand: {
		type: Boolean,
		default: false
	}
}

export const phoneInputProps = {
	...ElInput.props,
	modelValue: [String, Number] as PropType<string | number>,
	// 是否有手机号前缀
	isPrefix: propTypes.bool.def(true),
	// 手机号前缀
	prefix: propTypes.string.def(''),
	// 手机号前缀下拉列表
	prefixList: propTypes.array.def(() => ['86', '852', '886', '81', '1', '44', '39']),
	// select 下拉宽度
	prependWidth: propTypes.string.def('100px')
}

// 组织架构选择器props
export const organizationSelectProps = {
	modelValue: {
		type: [String, Array],
		default: ''
	},
	salesNoList: {
		type: Array,
		default: () => []
	},
	// 指定员工允许为空,默认为false 不允许为空
	allowEmptySales: {
		type: Boolean,
		default: false
	},
	// 组织架构使用模式 select | button
	mode: {
		type: String,
		default: 'select'
	}
}
// 组织架构选择器弹窗props
export const organizationSelectModalProps = {
	// 标题
	title: {
		type: String,
		default: '组织架构选择'
	},
	// 标题
	dataPerm: {
		type: String,
		default: ''
	},
	// 是否可选组织架构
	selectableMode: {
		type: String, // all,dept
		default: 'all'
	},
	// 禁用的销售编号列表
	disabledSalesNoList: {
		type: Array,
		default: () => []
	},
	useUserId: {
		type: Boolean,
		default: false
	},
	//完整的组织架构(所有成员不限于销售人员)-默认false，必须useUserId为true
	whole: {
		type: Boolean,
		default: false
	},
	// 是否过滤数据权限
	filterPerm: {
		type: Boolean,
		default: true
	}
}
