<template>
	<elPopover
		ref="popover"
		v-model:visible="visible"
		transition="el-zoom-in-top"
		placement="bottom"
		trigger="click"
		:width="boxWidth"
	>
		<template #reference>
			<elButton
				ref="refLabel"
				plain
				class="w-full custom-button"
				:class="{ 'border-[var(--el-color-primary)]!': visible }"
				type="default"
			>
				<elIcon class="mr-10px"><Calendar /></elIcon>
				<span class="sle" :class="{ 'color-gray-400': !display.label }">{{
					display.label || '请选择'
				}}</span>
				<elIcon
					:class="{ 'rotate--180': visible }"
					class="color-#a8abb2"
					@click.stop="isClearable && clear()"
					><CircleClose v-if="isClearable" />
					<ArrowDown v-else />
				</elIcon>
			</elButton>
		</template>
		<div class="shortcuts rounded-t">
			<elRow
				v-for="(item, index) in shortcuts?.length > 0 ? shortcuts : filterDefaultShortCuts"
				:key="index"
				class="items-center h-32px"
			>
				<elCol :span="8">
					<span class="w-60px">{{ item.label }}</span>
				</elCol>
				<elCol v-for="(child, idx) in item.children || []" :key="idx" :span="8">
					<elLink
						:type="child.label === display.label ? 'primary' : 'default'"
						:underline="false"
						class="flex-1 text-center"
						@click="getDateRange(child)"
					>
						{{ child.label }}
					</elLink>
				</elCol>
			</elRow>
		</div>
		<div class="custom rounded-b">
			<div class="font-size-12px mb-6px">{{ $t('word.customize') }}</div>
			<elDatePicker
				v-bind="{
					...omit(props, ['defaultValue', 'startTime', 'endTime', 'shortcuts', 'modelValue'])
				}"
				v-model="pickerDate"
				class="w-full!"
				:defaultTime="[new Date(2000, 1, 1, 0, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59, 999)]"
				:teleported="false"
				:clearable="false"
				@change="emit('change')"
			>
			</elDatePicker>
		</div>
	</elPopover>
</template>

<script setup lang="ts">
import { getRelativeDateRange } from '@/utils'
import { datePickerProps } from 'element-plus'
import type { PropType } from 'vue'
import { useElementHover, useResizeObserver } from '@vueuse/core'
import { omit } from 'lodash-es'
import dayjs from 'dayjs'
defineOptions({
	name: 'DateRangePicker',
	inheritAttrs: true
})
const emit = defineEmits([
	'update:modelValue',
	'update:startTime',
	'update:endTime',
	'change',
	'getLabel'
])
const display = ref<{ label?: string; value?: Array<string> }>({})
const visible = ref(false)
const refLabel = ref<any>(null)
const boxWidth = ref<number>(360)
const props = defineProps({
	...datePickerProps,
	modelValue: {
		type: Array,
		default: () => []
	},
	startTime: {
		type: [Date, String],
		default: ''
	},
	endTime: {
		type: [Date, String],
		default: ''
	},
	type: {
		type: String as PropType<'datetimerange' | 'daterange' | 'monthrange'>,
		default: 'monthrange'
	},
	format: {
		type: String,
		default: 'YYYY-MM'
	},
	valueFormat: {
		type: String,
		default: 'x'
	},
	shortcuts: {
		type: Array as PropType<any[]>,
		default: () => null
	},
	dimensions: {
		type: Array as PropType<string[]>,
		default: () => ['month', 'quarter', 'year']
	},
	useSplit: {
		type: Boolean,
		default: true
	}
})
const isHovered = useElementHover(refLabel)
const defaultShortCuts = computed(() => [
	{
		label: '周',
		value: 'week',
		children: [
			{
				label: '本周',
				value: getRelativeDateRange('week', 0, props.valueFormat)
			},
			{
				label: '上周',
				value: getRelativeDateRange('week', -1, props.valueFormat)
			}
		]
	},
	{
		label: '月',
		value: 'month',
		children: [
			{
				label: '本月',
				value: getRelativeDateRange('month', 0, props.valueFormat)
			},
			{
				label: '上月',
				value: getRelativeDateRange('month', -1, props.valueFormat)
			}
		]
	},
	{
		label: '季度',
		value: 'quarter',
		children: [
			{
				label: '本季度',
				value: getRelativeDateRange('quarter', 0, props.valueFormat)
			},
			{
				label: '上一季度',
				value: getRelativeDateRange('quarter', -1, props.valueFormat)
			}
		]
	},
	{
		label: '年度',
		value: 'year',
		children: [
			{
				label: '本年度',
				value: getRelativeDateRange('year', 0, props.valueFormat)
			}
		]
	}
])
// 按时间维度过滤
const filterDefaultShortCuts = computed(() =>
	defaultShortCuts.value.filter(item => props.dimensions.includes(item.value))
)
// 动态宽度
useResizeObserver(refLabel, entries => {
	const entry = entries[0]
	const { target }: any = entry
	boxWidth.value = target.offsetWidth
})
// 是否可清除
const isClearable = computed(() => display.value.value && props.clearable && isHovered.value)
const pickerDate = computed<any>({
	get() {
		if (props.useSplit) {
			const { startTime, endTime } = props
			if (!startTime && !endTime) {
				setDisplayValue({})
			} else {
				setDisplayValue(getLabel([startTime, endTime]))
			}
			return !startTime && !endTime ? [] : [startTime, endTime]
		} else {
			if (props.modelValue?.length === 0) {
				setDisplayValue({})
				return []
			}
			const dateFormat = (item: any) =>
				props.valueFormat === 'x'
					? +dayjs(item).format(props.valueFormat)
					: dayjs(item).format(props.valueFormat)
			const dateList = props.modelValue.map(dateFormat)
			setDisplayValue(getLabel(dateList))
			return dateList
		}
	},
	set(val) {
		visible.value = false
		if (props.useSplit) {
			emit('update:startTime', val?.[0])
			emit('update:endTime', val?.[1])
		} else {
			emit('update:modelValue', val || [])
		}
	}
})
const popover = ref<any>(null)
const getDateRange = (item: any) => {
	pickerDate.value = item.value
}
const setDisplayValue = (value: any) => {
	display.value = value
}
const getLabel = (dateList: any[]) => {
	let target = {
		label: dateList.map((item: any) => dayjs(item).format(props.format)).join(' - '),
		value: dateList
	}
	const shortcuts = props.shortcuts?.length > 0 ? props.shortcuts : filterDefaultShortCuts.value
	for (const item of shortcuts) {
		let shortTarget = item.children.find(
			(item: any) => JSON.stringify(item.value) === JSON.stringify(dateList)
		)
		if (shortTarget) {
			target = shortTarget
			break
		}
	}
	emit('getLabel', target.label)
	return target
}
// 清空组件
const clear = () => {
	display.value = {}
	emit('update:modelValue', [])
	emit('update:startTime', '')
	emit('update:endTime', '')
}
</script>
<style lang="scss" scoped>
.shortcuts,
.custom {
	padding: 8px 12px;
	border: 1px solid #ccc;
}
.custom {
	border-top: none;
}
</style>
<style lang="scss">
.custom-button {
	span {
		display: flex !important;
		justify-content: space-between;
		width: 100%;
	}
	&:hover,
	&:focus {
		color: var(--el-text-color-regular);
		border-color: var(--el-border-color);
	}
	.el-icon {
		transition: all 0.3s;
	}
}
</style>
