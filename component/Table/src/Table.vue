<template>
	<div ref="tableContainerRef" class="table-container">
		<div v-if="!noTableTools" class="table-tools flex justify-between mb-10px">
			<div class="mr-8px flex-1 flex justify-end">
				<slot name="tableTools" :selections="selectionList"></slot>
			</div>
			<div class="flex items-center">
				<!-- 大表下载或常规异步导出 -->
				<DownloadBtn
					v-if="
						(downloadTemplateCode || downloadUrl) &&
						(downloadAuthority === 'noAuth' || hasPermission(downloadAuthority))
					"
					class="mr-8px ml-4px"
				>
					<template #default="{ dFun, dLoading }">
						<elButton :loading="dLoading" type="primary" :icon="Download" @click="downloadFn(dFun)">
							{{ $t('table.export') }}
						</elButton>
					</template>
				</DownloadBtn>
				<elDivider direction="vertical" />
				<elIcon size="20" class="cursor-pointer ml-2" @click="handleQuery()"><Refresh /></elIcon>
				<ColumnSetting
					v-if="setting"
					:use-storage="useStorage"
					:tableName="tableName"
					:tableSchema="tableSchema"
					@getFilterTableSchema="getFilterTableSchema"
				/>
			</div>
		</div>
		<slot name="tableTopTips"></slot>
		<elTable
			ref="tableRef"
			v-loading="loading"
			v-bind="props"
			:class="{ 'is-radio': radio }"
			:header-cell-style="{ background: '#fafafa', color: '#606266' }"
			:max-height="maxHeight || customMaxHeight"
			:stripe="stripe"
			:border="border"
			:data="dataSource"
			:row-key="rowKey"
			size="default"
			:empty-text="loading && !dataSource.length ? ' ' : $t('word.noData')"
			class="h-full! w-full"
			:header-cell-class-name="customHeaderCellClassName"
			@selection-change="selectionChange"
			@sort-change="sortChange"
		>
			<elTableColumn
				v-if="showSelection"
				fixed="left"
				reserve-selection
				:selectable="selectable"
				type="selection"
				width="55"
			/>
			<elTableColumn
				v-if="showIndex"
				fixed="left"
				:index="indexMethod"
				label="#"
				type="index"
				width="55"
			/>

			<elTableColumn v-for="schema in currentTableSchema" :key="schema.prop" v-bind="schema">
				<template #header="scope">
					<slot :name="schema.prop + 'Header'" :column="scope.column" :index="scope.$index">
						<span>{{ schema.label }}</span>
					</slot>
				</template>
				<template #default="scope">
					<slot
						v-if="scope.$index > -1"
						:name="schema.prop"
						:row="scope.row"
						:schema="schema"
						:index="scope.$index"
					>
						<span> {{ tableFilter(scope.row[schema.prop], schema, scope.row) }} </span>
					</slot>
				</template>
			</elTableColumn>
			<elTableColumn
				v-if="operation"
				:width="operationWidth"
				header-align="center"
				align="center"
				fixed="right"
				:label="$t('table.operation')"
			>
				<template #default="scope">
					<elSpace>
						<slot name="tableOperation" :row="scope.row" :index="scope.$index">
							<span class="empty">/</span>
						</slot>
					</elSpace>
				</template>
			</elTableColumn>
		</elTable>
		<div v-if="showPagination" class="pager-container flex mt-10px items-center">
			<div class="flex-1 text-size-sm color-[var(--el-text-color-regular)]">
				<span v-show="showSelection && !radio && selectionList.length > 0">{{
					$t('table.selectedItems', { total: selectionList.length })
				}}</span>
			</div>
			<elPagination
				v-model:current-page="paginationData.pageIndex"
				class="justify-end"
				:page-sizes="props.pageSizes"
				:page-size="paginationData.pageSize"
				layout="total, sizes, prev, pager, next"
				:total="paginationData.total"
				@size-change="handleSizeChange"
				@current-change="handleCurrentChange"
			></elPagination>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Download } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { pick, isEmpty, isObject } from 'lodash-es'
import { tableFilter, setResourceItems, useResizeTable, clearResourceItems } from './utils'
import { http } from '@/http'
import { objectToUrlParams } from '@/utils'
import { tableProps } from './props'
import type { TableSchema } from './type'
import ColumnSetting from './components/ColumnSetting.vue'
import { useI18n } from '@/hooks'
const { t } = useI18n()
const attrs = useAttrs()
const { hasPermission } = usePermission()
defineOptions({
	name: 'TableComp',
	inheritAttrs: false
})
// 获取组件实例
const instance = getCurrentInstance()
const emit = defineEmits(['selection-change', 'setLoading', 'sort-change'])
const props = defineProps(tableProps)
// 表格数据
const data = ref([])
const selectionList = ref([])
const sortList = ref<{ fieldName: string; sortType: 'ASC' | 'DESC' }[]>([])
const filterTableSchema = ref<TableSchema[]>([])
// 上次查询参数
let lastQueryParams = {}
// 记录上次请求时间
let lastTime = Date.now()
// 列配置项设置Index
const paginationData = reactive({
	pageIndex: 1,
	pageSize: props.defaultPageSize || 20,
	total: 0
})
const tableContainerRef = ref(null)
const tableRef = ref<any>(null)
const { maxHeight: customMaxHeight } = useResizeTable(tableContainerRef)

// 索引序号规则
const indexMethod = (index: number) => {
	return index + 1 + (paginationData.pageIndex - 1) * paginationData.pageSize
}
// 数据源
const dataSource = computed(() => {
	return props.requestUrl ? data.value : props.tableData
})
// 当前配置文件
const currentTableSchema = computed(() => {
	return !props.noTableTools && props.setting ? filterTableSchema.value : props.tableSchema
})
// 自定义表头类名
const customHeaderCellClassName = ({ row, column, rowIndex, columnIndex }: any) => {
	const { sortType } = sortList.value.find(item => item.fieldName === column.property) || {}
	return `${sortTypeMap[sortType!] || ''} ${
		props.headerCellClassName?.({
			row,
			column,
			rowIndex,
			columnIndex
		}) || ''
	}`
}

// 查询
const handleQuery = (params: any = {}) => {
	if (!isObject(params)) return console.warn('请输入合法参数')
	emit('setLoading', true)
	const { pageIndex, pageSize } = paginationData
	const { requestUrl, requestMethod, extraParams = {}, afterQuery = null } = props
	if (!requestUrl) return emit('setLoading', false)
	if (isEmpty(params)) {
		// 获取form 表单参数
		params = instance?.parent?.exposed?.getParams?.() || lastQueryParams
	}
	// 大表post查询兼容
	const requestParams =
		requestMethod === 'post' ? objectToUrlParams({ pageIndex, pageSize, ...extraParams }) : ''
	// 添加排序字段
	if (sortList.value.length > 0) params.sortList = unref(sortList)
	// 记录上次查询参数
	lastQueryParams = params
	// 记录请求时间，避免接口数据污染
	const now = Date.now()
	http[requestMethod as 'get' | 'post'](requestUrl + requestParams, {
		pageIndex,
		pageSize,
		...params
	})
		.then((res: any) => {
			if (res.code === '0000' && now > lastTime) {
				// 给表格数据拓展索引$index
				if (props.needDataIndex) {
					;(res.data || []).forEach((item: any, index: number) =>
						Object.assign(item, { $index: indexMethod(index) })
					)
				}
				data.value = res.data
				paginationData.total = res.total
				// 数据处理的后置钩子
				afterQuery?.(res.data, params)
				// 重置上次请求时间
				lastTime = now
			}
		})
		.finally(() => {
			emit('setLoading', false)
		})
}
// 清空表格数据
const clearData = () => {
	data.value = []
	paginationData.total = 0
}

// 清空表格数据
const getData = () => {
	return dataSource.value
}
// 重置页码，查询
const handleSearch = (params?: any, isClearData: boolean = true) => {
	paginationData.pageIndex = 1
	isClearData && clearData()
	handleQuery(params)
}
// 获取选中行
const getSelection = () => {
	return tableRef.value.getSelectionRows()
}
/// 页数切换
const handleSizeChange = (val: number) => {
	paginationData.pageSize = val
	handleQuery()
}
// 页码切换
const handleCurrentChange = (val: number) => {
	paginationData.pageIndex = val
	tableRef.value.setScrollTop(0)
	handleQuery()
}
// 设置配置项
const getFilterTableSchema = (tableSchema: TableSchema[]) => {
	filterTableSchema.value = tableSchema
}
// 选中项变化
const selectionChange = (selection: any) => {
	// 单选配置，值选中一个
	if (selection.length > 1 && props.radio) {
		let delRow = selection.shift()
		// 用于多选表格，切换某一行的选中状态，如果使用了第二个参数，则是设置这一行选中与否（selected 为 true 则选中）
		tableRef.value.toggleRowSelection(delRow, false)
	}
	selectionList.value = selection
	emit('selection-change', selection)
}
// 大表查询或异步下载方法
const downloadFn = (downloadFun: any) => {
	// 获取form 表单参数
	let data = instance?.parent?.exposed?.getParams() || {}
	if (props.downloadUrl) {
		downloadFun(props.downloadUrl, data, 'get')
		return
	}
	// 校验日期范围，不在范围内禁止下载
	let checkObj = checkDownloadLimitMaxDay(data)
	if (!checkObj.checkFlag) return
	if (props.downloadTemplateCode) {
		downloadFun(
			`/file/homeAdb/download?templateCode=${props.downloadTemplateCode}`,
			checkObj.data,
			'post'
		)
	}
}
// 获取大表导出最大日期范围
const checkDownloadLimitMaxDay = (data: any) => {
	// 获取最大日期范围
	const { formSchema, formatDateTime }: any = attrs || {}
	// 获取含有最大导出日期范围的表单项
	const targetItem = formSchema.find(
		(item: any) =>
			item.isDownloadLimit &&
			['daterange', 'datetimerange', 'selectDatetimerange'].includes(item.type)
	)
	// 获取到目标项，判断日期范围
	if (targetItem) {
		let { prop, prependOptions = [] } = targetItem
		// 当选中的日期字段属于忽略字段时，不进行校验
		for (const item of prependOptions) {
			if (prop === item.value && item.ignore) return { data, checkFlag: true }
		}
		// 获取最大限制天数
		const { downloadLimitMaxDays } = props
		// 获取开始和结束时间
		let start, end
		if (formatDateTime) {
			start = data[`${prop}Start`]
			end = data[`${prop}End`]
		} else {
			;[start, end] = data[prop]
		}
		// 当日期均有值时，进行计算是否在区间范围内
		if (start && end) {
			const diff = dayjs(end).diff(dayjs(start), 'day') + 1
			if (diff > downloadLimitMaxDays) {
				ElMessage({
					type: 'warning',
					message: t('validate.downloadLimitTips', {
						downloadLimitMaxDays
					})
				})
				return { checkFlag: false }
			}
		}
	}
	return { data, checkFlag: true }
}
// 设置排序方法
const sortTypeMap: any = {
	ascending: 'ASC',
	descending: 'DESC',
	ASC: 'ascending',
	DESC: 'descending'
}
const sortChange = ({ prop, order }: { prop: string; order: 'ASC' | 'DESC' }) => {
	const sortType = sortTypeMap[order]
	sortList.value = sortList.value.filter(item => item.fieldName !== prop)
	sortType && sortList.value.unshift({ fieldName: prop, sortType })
	handleQuery()
}
// 设置默认排序
const setDefaultSort = () => {
	const { defaultSort = {} } = props
	let list: any[] = []
	Object.keys(defaultSort).forEach((prop: string) => {
		Object.keys(sortTypeMap).includes(defaultSort[prop]) &&
			list.push({
				fieldName: prop,
				sortType: ['ASC', 'DESC'].includes(defaultSort[prop])
					? defaultSort[prop]
					: sortTypeMap[defaultSort[prop]]
			})
	})
	sortList.value = list
	return list
}
setDefaultSort()
// 重置排序
const resetSort = () => {
	sortList.value = setDefaultSort()
	tableRef.value.clearSort()
}
// 继承table的方法
const methods = {
	handleQuery,
	handleSearch,
	getSelection,
	clearTableDictCache: (props: string[]) => clearResourceItems(props, currentTableSchema.value),
	resetSort,
	clearData,
	getData
}
watch(
	() => currentTableSchema.value,
	() => {
		setResourceItems(currentTableSchema.value)
	},
	{
		immediate: true
	}
)
onMounted(() => {
	// 初始化表格数据字典
	Object.assign(
		methods,
		pick(tableRef.value, [
			'clearSelection',
			'toggleRowSelection',
			'setCurrentRow',
			'setScrollTop',
			'setScrollLeft',
			'doLayout',
			'sort',
			'clearSort'
		])
	)
})
// 暴露方法
defineExpose(methods)
</script>
<style scoped lang="scss">
// 隐藏全选按钮
:deep(.el-table.is-radio th.el-table__cell:nth-child(1) .cell) {
	visibility: hidden;
}
:deep(.el-space) {
	.el-space__item:only-child,
	.el-space__item:last-child {
		margin-right: 0 !important;
	}
}
</style>
