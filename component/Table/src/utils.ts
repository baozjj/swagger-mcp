import dayjs from 'dayjs'
import { useResizeObserver } from '@vueuse/core'
import { useAppStoreWithOut, getKeyAndApi } from '@/store/modules/app'
import { useSettingStoreHook } from '@/store/modules/setting'
import { isNumber, isEmpty, isArray } from 'lodash-es'
import type { TableSchema } from './type'
import { makeDict, toArray, customFormat } from '@/utils'
export const { resourceMap, setResourceItem } = useAppStoreWithOut()
const dateFullTimeProps = ['createdAt', 'updatedAt', 'completedAt']
// 获取数据字典资源
const getResource = (url: any, params: any) => {
	let isReady = true
	const resource = toArray(url).reduce((result: any, item: string, index: number) => {
		const { key } = getKeyAndApi(item, toArray(params)[index] || {})
		if (!resourceMap[key]) isReady = false
		result.push(...(resourceMap[key] || []))
		// 接口数据未返回
		return result
	}, [])
	return isReady ? resource : null
}
// 数据字段过滤器
export const tableFilter = (value: any, schema: TableSchema, item: any) => {
	if (isEmpty(item)) return
	let { type } = schema || {}
	const {
		prop,
		url,
		params = {},
		customKey = { label: 'label', value: 'value' },
		localOptions = [],
		multiple = false,
		emptyText = '',
		needLabel = false,
		format = null
	} = schema || {}
	let dictValue = ''
	if (!type && dateFullTimeProps.includes(prop)) type = 'dateFullTime'
	if (!type && (url || localOptions.length)) type = 'dict'
	// 创建数据字典映射
	if (type === 'dict' && !schema._dictMap) {
		let options = url ? getResource(url, params) : localOptions
		// url数据字典时，尝试加入本地数据字典
		if (isArray(options) && url) options = options.concat(localOptions)
		schema._dictMap = Object.freeze(makeDict(options, customKey))
	}
	if (schema._dictMap) {
		if (multiple) {
			// 多值转换
			const valueArr = Array.isArray(value) ? value : value.split(',')
			dictValue = valueArr
				.map((item: string) => schema._dictMap?.[item])
				.filter((v: any) => v) // 过滤掉空值
				.join(',')
		} else {
			dictValue = schema._dictMap?.[value] || ''
		}
		needLabel && (item[`${prop}ToLabel`] = dictValue)
	}
	switch (type) {
		case 'dateFullTime':
			schema.width || (schema.width = 170)
			return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : emptyText
		case 'date':
			schema.width || (schema.width = 120)
			return value ? dayjs(value).format('YYYY-MM-DD') : emptyText
		case 'time':
			schema.width || (schema.width = 90)
			return value ? dayjs(value).format('HH:mm:ss') : emptyText
		case 'dict':
			return dictValue || emptyText
		case 'amount': {
			if (value || value === 0) {
				const parts = value.toString().split('.')
				parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
				return customFormat(format, parts.join('.'), item)
			} else {
				return value || emptyText
			}
		}
		default:
			// 如果value为0且format为null，则返回0
			if (value === 0 && !format) return value
			return customFormat(format, value, item) || emptyText
	}
}

// 设置数据字典缓存
export const setResourceItems = (tableSchema: TableSchema[], defaultRefresh: boolean = false) => {
	const resourceItems: TableSchema[] = tableSchema.filter((item: TableSchema) => item.url)
	for (const item of resourceItems) {
		const { url = '', params, refresh = defaultRefresh } = item
		if (item._dictMap && refresh) delete item._dictMap
		const urlList: any = isArray(url) ? url : [url]
		urlList.forEach((url: string, idx: number) => {
			setResourceItem({ url, params: (isArray(params) ? params[idx] : params) || {}, refresh })
		})
	}
}

// 刷新数据缓存
export const clearResourceItems = (props: string[], tableSchema: TableSchema[]) => {
	const resourceItems: TableSchema[] = tableSchema.filter(item => props.includes(item.prop))
	setResourceItems(resourceItems, true)
}

// 表格resize hook
export function useResizeTable(tableContainerRef: any) {
	const maxHeight = ref()
	let lastHeight = 0
	const { fixedHeight } = storeToRefs(useSettingStoreHook())
	let stop: any = null
	watch(
		() => fixedHeight.value,
		(val: boolean) => {
			if (val) {
				const instance = useResizeObserver(tableContainerRef, entries => {
					const entry = entries[0]
					const { height } = entry.contentRect
					if (lastHeight === parseInt(height)) return
					lastHeight = parseInt(height)
					const pagerHeight =
						tableContainerRef.value.querySelector('.pager-container').offsetHeight || -10
					const toolsHeight =
						tableContainerRef.value.querySelector('.table-tools')?.offsetHeight || 0
					maxHeight.value = height - (pagerHeight + 10) - (toolsHeight + 10)
				})
				stop = instance.stop
			} else {
				stop && stop()
				maxHeight.value = '100%'
				lastHeight = 0
			}
		},
		{
			immediate: true
		}
	)
	return { maxHeight }
}
