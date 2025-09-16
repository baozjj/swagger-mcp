<template>
	<Form
		v-bind="props"
		ref="formRef"
		:loading="loading"
		@query="query"
		@resetSort="resetSort"
		@clearSelection="clearSelection"
		@setLoading="setLoading"
		@getFormModel="
			(formModel: any, oldFormModel: any) => emit('getFormModel', formModel, oldFormModel)
		"
	>
		<template #before="{ dataSource }">
			<slot name="before" :loading="loading" :dataSource="dataSource"></slot>
		</template>
		<!-- 注意：此处插槽为避免和table插槽相同，固加上form前缀 -->
		<template v-for="schema in props.formSchema" #[schema.prop]="{ dataSource }">
			<slot
				:name="padStartStr(schema.prop, 'form')"
				:schema="schema"
				:dataSource="dataSource"
			></slot>
		</template>
	</Form>
	<!-- 默认插槽 -->
	<slot :loading="loading"></slot>
	<Table
		v-bind="props"
		ref="tableRef"
		:loading="loading"
		@setLoading="setLoading"
		@selection-change="handleSelectChange"
	>
		<template v-for="schema in props.tableSchema" #[schema.prop]="{ row, index }">
			<slot :name="schema.prop" :schema="schema" :row="row" :index="index"></slot>
		</template>
		<template v-for="schema in props.tableSchema" #[`${schema.prop}Header`]="{ column, index }">
			<slot :name="`${schema.prop}Header`" :column="column" :index="index"></slot>
		</template>
		<!-- 操作方法 -->
		<template #tableOperation="{ row, index }">
			<slot name="tableOperation" :row="row" :index="index"> </slot>
		</template>
		<template #tableTools="{ selections }">
			<slot name="tableTools" :selections="selections"> </slot>
		</template>
		<template #tableTopTips>
			<slot name="tableTopTips"></slot>
		</template>
	</Table>
</template>

<script setup lang="ts">
import { padStartStr } from '@/utils'
import { formTableProps } from './props'
defineOptions({
	name: 'FormTable'
})
const emit = defineEmits(['query', 'getFormModel', 'selection-change'])
const props = defineProps(formTableProps)
const tableRef = ref<any>(null)
const formRef = ref<any>(null)
const loading = ref<boolean>(false)
// 触发查询
const query = (params: any) => {
	emit('query', params)
	tableRef.value?.handleQuery(params)
}
// 设置loading状态
const setLoading = (bool: boolean) => {
	loading.value = bool
}
// 主动获取查询参数
const getParams = () => {
	return formRef.value?.getParams()
}
// 重置排序
const resetSort = () => tableRef.value?.resetSort()
// 清空选中项
const clearSelection = () => tableRef.value?.clearSelection()
const handleSelectChange = (selection: any) => {
	emit('selection-change', selection)
}
onMounted(() => {
	let formMethods = formRef.value
	let tableMethods = tableRef.value
	Object.assign(methods, formMethods, tableMethods)
})

// 向外暴露组件事件
let methods: any = { getParams, loading }
defineExpose(methods)
</script>
<style scoped></style>
