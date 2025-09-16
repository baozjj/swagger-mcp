<template>
	<div class="query-select w-full">
		<elSelect
			v-if="!detail"
			ref="elSelectRef"
			v-bind="{ ...props, ...attrs }"
			v-model="value"
			class="w-full"
			:placeholder="placeholder || (remote ? ' ' : $t('validate.pleaseSelect'))"
			:loading="loading"
			:remote-method="remote ? remoteMethod : null"
			@visible-change="handleVisibleChange"
		>
			<slot name="before"></slot>
			<elOption v-if="showAllOption" :label="$t('form.all')" :value="allOptionValue" />
			<elOption
				v-for="(item, index) in options"
				:key="index"
				:disabled="disabledFun?.(item, customName, formModel)"
				:label="item[customKey.label]"
				:value="item[customKey.value]"
				@click="$emit('optionClick', item, customName, formModel)"
			/>
			<slot name="after"></slot>
		</elSelect>
		<span v-else>{{ label }}</span>
	</div>
</template>

<script setup lang="ts">
import { querySelectProps } from '../props'
import type { IOptions } from '../type.ts'
import { toArray } from '@/utils'
import { http } from '@/http'
import { useAppStoreWithOut } from '@/store/modules/app'
import { intersection, isArray, cloneDeep, flatten, isString, pick, isFunction } from 'lodash-es'
const { setResourceItem } = useAppStoreWithOut()
defineOptions({
	name: 'QuerySelect',
	inheritAttrs: true
})
const attrs: any = useAttrs()
const props = defineProps(querySelectProps)
const emit = defineEmits([
	'update:modelValue',
	'optionClick',
	'getOptions',
	'setInit',
	'visibleChange'
])
const options = ref<IOptions[]>([])
const loading = ref(false)
const elSelectRef = ref()
const exposeMethods = {}
onMounted(() => {
	Object.assign(exposeMethods, pick(elSelectRef.value, ['focus', 'blur']))
	// 远程搜索开启，关闭自动查询
	if (props.remote && props.auto) return remoteMethod('', true)
	if (props.localOptions.length > 0) {
		options.value = props.localOptions as IOptions[]
		return
	}
	if (props.url && props.auto) getOptions()
})
// 本地localOptions 监听
watch(
	() => props.localOptions,
	(val: any[]) => {
		options.value = val
	}
)
// 监听url和params变化
watch([() => props.url, () => props.params], ([url, params], [oldUrl, oldParams]) => {
	if (
		url?.toString() !== oldUrl?.toString() ||
		JSON.stringify(params) !== JSON.stringify(oldParams)
	) {
		if (props.remote) return remoteMethod('', true)
		getOptions()
	}
})
// 监听modelValue变化
const value = computed({
	get: () => props.modelValue,
	set: val => {
		const { showAllOption, allOptionValue, multiple } = props
		// 处理全选选项的特殊逻辑
		if (showAllOption && multiple && val.includes(allOptionValue)) {
			const hasAllOption = (props.modelValue as Array<any>).includes(allOptionValue)
			// 如果已经选中全选,则移除全选;否则只保留全选选项
			const newVal = hasAllOption
				? val.filter((item: any) => item !== allOptionValue)
				: [allOptionValue]
			emit('update:modelValue', newVal)
			return
		}
		emit('update:modelValue', val)
	}
})
// 做详情展示
const label = computed(() => {
	const { value, label } = props.customKey
	const { modelValue, multiple } = props

	if (multiple) {
		const modelValues = modelValue || []
		const optionsMap = new Map(options.value.map(item => [item[value], item[label]]))
		return modelValues
			.map((val: any) => optionsMap.get(val))
			.filter(Boolean)
			.join(',')
	}

	const option = options.value.find(item => item[value] === modelValue)
	return option?.[label] || ''
})

// 过滤不匹配的选项
const dropNotMatchItem = () => {
	const { value } = props.customKey
	const { showAllOption, allOptionValue, modelValue, multiple } = props

	// 获取所有选项的值
	const optionsValue = options.value.map(item => item[value])

	// 如果有全选选项且为多选模式,添加全选值
	if (showAllOption && multiple) {
		optionsValue.push(allOptionValue)
	}

	// 获取当前值与可选值的交集
	const modelValues = isArray(modelValue) ? modelValue : [modelValue]
	const validValues = intersection(optionsValue, modelValues)

	// 当前值不在可选值中时更新
	if (!optionsValue.includes(modelValue)) {
		const newValue = multiple ? validValues : validValues[0] || ''
		emit('update:modelValue', newValue)
	}
}
let lastDefaultSelectFirstFlag = false

// 异步接口默认选择第一条
const trySetDefaultSelectFirst = () => {
	const {
		multiple,
		customKey: { value },
		formModel,
		modelValue,
		defaultSelectFirst
	} = props

	// 计算是否需要默认选择第一项
	const defaultSelectFirstFlag = isFunction(defaultSelectFirst)
		? defaultSelectFirst(formModel)
		: defaultSelectFirst

	// 处理默认选择第一项
	if (options.value.length && defaultSelectFirstFlag) {
		const firstOption = options.value[0]
		const newValue = multiple ? [firstOption[value]] : firstOption[value]

		// 只在没有值时自动填充
		if (!modelValue?.toString()) {
			emit('update:modelValue', newValue)
			emit('setInit', newValue)
		}
	}

	// 处理状态变化时清空选项
	const shouldClear =
		!defaultSelectFirstFlag && lastDefaultSelectFirstFlag !== defaultSelectFirstFlag
	if (shouldClear) {
		const emptyValue = multiple ? [] : ''
		emit('update:modelValue', emptyValue)
		emit('setInit', emptyValue)
	}

	lastDefaultSelectFirstFlag = defaultSelectFirstFlag
}

// 获取options配置,当refresh值为true时，强制更新数据字典
const getOptions = async (refresh?: boolean) => {
	const {
		url,
		params,
		dynamicUpdate = false,
		addMoreOptions,
		addMoreType,
		filterFn,
		customName,
		formModel
	} = props

	if (!url) {
		console.error('url is required')
		return
	}

	try {
		refresh = refresh || dynamicUpdate

		// 拓展url联合下拉,前提条件label和value指示的字段一致
		const promiseAllOptions = toArray(url).map((item: string, idx: number) =>
			setResourceItem({
				url: item,
				params: toArray(params)[idx] || {},
				refresh
			})
		)

		const resList = await Promise.all(promiseAllOptions)
		const optionsList = cloneDeep(flatten(resList) as IOptions[])

		// 追加选择项
		if (addMoreOptions.length > 0) {
			optionsList[addMoreType](...addMoreOptions)
		}

		// 过滤选项函数
		options.value = filterFn!(optionsList, customName, formModel)

		// 移除不匹配项
		dropNotMatchItem()

		// 尝试处理首项
		trySetDefaultSelectFirst()

		emit('getOptions', options.value)
	} catch (error) {
		console.error('Failed to get options:', error)
	}
}
// 远程搜索
let lastKeyword: string | null = null
const remoteMethod = async (value: string, refresh: boolean = false) => {
	// 避免重复请求相同关键词
	if (lastKeyword === value && !refresh) return

	const { url = '', params, remoteKeyword } = props
	if (!isString(url)) return

	try {
		loading.value = true
		const res: any = await http.get(url, { ...params, [remoteKeyword]: value })

		// 限制返回数据量,避免大数据渲染性能问题
		const MAX_OPTIONS = 1000
		options.value = (res.data || []).slice(0, MAX_OPTIONS)
		lastKeyword = value
	} catch (error) {
		console.error('Failed to fetch remote options:', error)
		options.value = []
	} finally {
		loading.value = false
	}
}
const handleVisibleChange = (visible: boolean) => {
	emit('visibleChange', visible)
}
defineExpose(Object.assign(exposeMethods, { getOptions }))
</script>
