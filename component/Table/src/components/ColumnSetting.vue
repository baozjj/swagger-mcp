<template>
	<elPopover placement="bottom-start" :width="330" trigger="click" popper-class="p-0!">
		<div>
			<div
				class="flex items-center border-b b-[var(--el-border-color-light)] b-solid p-12px pt-10px pb-0"
			>
				<div class="flex-1">
					<elCheckbox v-model="checkAll" :indeterminate="indeterminate" class="mr-2!">
						{{ $t('table.columnDisplay') }}
					</elCheckbox>
				</div>
				<elLink size="small" type="primary" :underline="false" @click="reset">
					{{ $t('form.reset') }}
				</elLink>
			</div>
			<div class="p-12px pr-0">
				<elScrollbar max-height="300">
					<div ref="dragContainerRef" class="drag-container pr-12px">
						<div v-for="item in customTableSchema" :key="item.prop" class="flex items-center">
							<span class="flex-1">
								<elIcon class="table-column-drag-icon">
									<Rank />
								</elIcon>
								<elCheckbox v-model="item.isShow" class="ml-2" :label="item.label" />
							</span>
							<elTooltip placement="bottom-start" :content="$t('table.fixedLeft')">
								<elIcon
									class="cursor-pointer"
									:color="item.fixed === 'left' ? 'var(--el-color-primary)' : 'unset'"
									@click="handleColumnFixed(item, 'left')"
								>
									<Back />
								</elIcon>
							</elTooltip>
							<elDivider direction="vertical" />
							<elTooltip placement="bottom-start" :content="$t('table.fixedRight')">
								<elIcon
									class="cursor-pointer"
									:color="item.fixed === 'right' ? 'var(--el-color-primary)' : 'unset'"
									@click="handleColumnFixed(item, 'right')"
								>
									<Right />
								</elIcon>
							</elTooltip>
						</div>
					</div>
				</elScrollbar>
			</div>
		</div>
		<template #reference>
			<elIcon size="20" class="cursor-pointer ml-2">
				<Setting />
			</elIcon>
		</template>
	</elPopover>
</template>
<script setup lang="ts">
import Sortablejs from 'sortablejs'
import type Sortable from 'sortablejs'
import { cloneDeep, isEmpty } from 'lodash-es'
import { createLocalStorage } from '@/utils/cache'
import type { TableSchema, Fixed } from '../type'
defineOptions({
	name: 'ColumnSetting'
})

const props = defineProps({
	// 原始表格列配置
	tableSchema: {
		type: Array as PropType<TableSchema[]>,
		default: () => []
	},
	// 存储标识，默认为当前路由name
	tableName: {
		type: String,
		default: ''
	},
	// 是否使用本地缓存
	useStorage: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['getFilterTableSchema', 'getSettingShowIndex'])

const ls = createLocalStorage()
let customTableName: string = ''
let { name: routeName } = useRoute()
/* 拖拽排序 */
const dragContainerRef = ref(null)
let sortable: Sortable
onMounted(() => {
	// 配置项拖拽功能
	const el = unref(dragContainerRef)
	if (!el) return
	nextTick(() => {
		sortable = Sortablejs.create(unref(el), {
			animation: 500,
			delay: 400,
			delayOnTouchOnly: true,
			handle: '.table-column-drag-icon ',
			onEnd: (evt: any) => {
				const { oldIndex, newIndex } = evt
				if (oldIndex === newIndex) {
					return
				}
				// Sort column
				const columns = customTableSchema.value

				if (oldIndex > newIndex) {
					columns.splice(newIndex, 0, columns[oldIndex])
					columns.splice(oldIndex + 1, 1)
				} else {
					columns.splice(newIndex + 1, 0, columns[oldIndex])
					columns.splice(oldIndex, 1)
				}

				customTableSchema.value = columns
			}
		})
	})
})
onBeforeUnmount(() => {
	sortable?.destroy()
})
/* ========= */

/* 获取本地缓存的配置 */
const getLocalSchema = (name?: string) => {
	// 获取整个table的本地缓存
	if (!name) return ls.get('tableLocalSchema', {})
	const targetSchema: any = []
	const customSchema = ls.get('tableLocalSchema', {})[name] || []
	// 获取映射关系
	const propsSchemaMap = props.tableSchema.reduce((target: any, item: any, index: number) => {
		target[item.prop] = { ...item, index }
		return target
	}, {})
	// 添加本地缓存的配置，过滤不存在的prop
	customSchema.forEach((item: any) => {
		if (!propsSchemaMap[item.prop]) return
		targetSchema.push({ ...propsSchemaMap[item.prop], ...item })
		delete propsSchemaMap[item.prop]
	})
	// 添加剩余的配置
	Object.values(propsSchemaMap).forEach((item: any) => {
		targetSchema.splice(item.index, 0, { ...item, isShow: item.isShow ?? true })
	})
	return targetSchema
}
/* 设置本地缓存的配置 */
const setLocalSchema = (name: string, schema: TableSchema[]) => {
	const localSchema = getLocalSchema()
	ls.set('tableLocalSchema', { ...localSchema, [name]: schema })
}
/* 获取初始化配置 */
const getInitTableSchema = () => {
	return cloneDeep(
		props.tableSchema.map((item: TableSchema) => ({ ...item, isShow: item.isShow ?? true }))
	)
}
const customTableSchema: Ref<any> = ref([])
watch(
	() => props.tableName,
	() => {
		/* 存储配置Name */
		nextTick(() => {})
		customTableName = props.tableName || (routeName as string)
		/* 本地缓存的配置 */
		const tableLocalSchema = getLocalSchema(customTableName)
		customTableSchema.value =
			isEmpty(unref(tableLocalSchema)) && !props.useStorage
				? getInitTableSchema()
				: tableLocalSchema
	},
	{ immediate: true }
)
// 监听配置项变化，触发父组件获取配置项，并储存配置
watch(
	() => customTableSchema.value,
	() => {
		// 存贮表配置项
		props.useStorage &&
			setLocalSchema(
				customTableName,
				customTableSchema.value.map((item: any) => ({
					prop: item.prop,
					isShow: item.isShow,
					fixed: item.fixed
				}))
			)
		emit(
			'getFilterTableSchema',
			customTableSchema.value.filter((item: any) => item.isShow)
		)
	},
	{ deep: true, immediate: true }
)
// 半选逻辑
const indeterminate = computed(() => {
	const len = customTableSchema.value.filter((item: any) => item.isShow).length
	return len > 0 && len < customTableSchema.value.length
})
// 全选和反选逻辑
const checkAll = computed({
	get() {
		return (
			customTableSchema.value.filter((item: any) => item.isShow).length ===
			customTableSchema.value.length
		)
	},
	set(bool: boolean) {
		customTableSchema.value = unref(customTableSchema).map((item: any) => ({
			...item,
			isShow: bool
		}))
	}
})
// 重置配置项，回到最初配置状态
const reset = () => {
	customTableSchema.value = getInitTableSchema()
}
// 固定列配置
const handleColumnFixed = (item: TableSchema, fixed: Fixed) => {
	item.fixed = item.fixed === fixed ? undefined : fixed
}
</script>
<style lang="scss" scoped>
.table-column-drag-icon {
	margin: 0 5px;
	cursor: move;
}
</style>
