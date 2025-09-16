<template>
	<QuerySelect
		v-if="mode === 'select'"
		:modelValue="modelValue"
		url="/oauth2/dataPermRole/dict/type"
		:clearable="clearable"
		@clear="
			() => {
				emit('update:modelValue', '')
				emit('update:salesNoList', [])
			}
		"
		@optionClick="optionClick"
		@getOptions="getOptions"
	/>
	<!-- 直接选择员工或组织架构 -->
	<QuerySelect
		v-if="mode === 'button'"
		ref="QuerySelectRef"
		v-bind="omit(props, ['title'])"
		:modelValue="modelValue"
		multiple
		:localOptions="selected"
		collapse-tags
		collapse-tags-tooltip
		effect="customized"
		popper-class="hidden"
		@update:modelValue="emit('update:modelValue', $event)"
		@click="() => !props.disabled && openModal()"
	/>
	<OrganizationSelectModal
		v-if="!(mode === 'select' && userInfo?.dataPerm === 'self')"
		ref="organizationSelectRef"
		v-bind="
			pick(props, [
				...Object.keys(organizationSelectModalProps),
				'clearable',
				'mode',
				'allowEmptySales'
			])
		"
		:salesNoList="computedSalesNoList"
		:dataPerm="mode === 'button' ? 'designate_employee' : modelValue"
		@setLabel="setLabel"
		@register="register"
		@submit="submit"
	/>
</template>

<script setup lang="ts">
import OrganizationSelectModal from './OrganizationSelectModal.vue'
import { pick, omit } from 'lodash-es'
import { querySelectProps, organizationSelectProps, organizationSelectModalProps } from '../props'
import { useModal, useUserStore } from '@/hooks'
const { userInfo } = useUserStore()
defineOptions({
	name: 'OrganizationSelect',
	inheritAttrs: false
})
const emit = defineEmits([
	'update:modelValue',
	'update:salesNoList',
	'setDefaultValue',
	'getLabel',
	'reset'
])
const props = defineProps({
	...querySelectProps,
	...organizationSelectProps,
	...organizationSelectModalProps
})
const organizationSelectRef = ref()
const QuerySelectRef = ref()
const [register, { openModal, getVisible }] = useModal()
let originLabel = ''
const selected = ref<any[]>([])
const options = ref<any[]>([])
const computedSalesNoList = computed(() => {
	return props.mode === 'select' ? props.salesNoList : props.modelValue || []
})
// select 聚焦状态优化
watch(
	() => getVisible?.value,
	visible => {
		nextTick(() => {
			QuerySelectRef.value?.[visible ? 'focus' : 'blur']?.()
		})
	}
)
const optionClick = (item: any) => {
	if (item.value === 'designate_employee') {
		openModal()
	} else {
		emit('update:modelValue', item.value)
		emit('getLabel', item.label)
		emit('update:salesNoList', [])
	}
}
// 重载组织架构选择
const reload = () => {
	return new Promise(resolve => {
		organizationSelectRef.value
			.reload()
			.then(() => resolve(true))
			.catch(() => resolve(false))
	})
}
const getOptions = (list: any[]) => {
	originLabel = list.find(item => item.value === 'designate_employee')?.label || ''
	emit('getLabel', list.find(item => item.value === props.modelValue)?.label || '')
	options.value = list
}
const setLabel = (selectedItem: any[] = []) => {
	setQuerySelectOptions(selectedItem)
	const nameStr =
		selectedItem
			.slice(0, 4)
			.map(item => `${item.nickname ? `${item.nickname} (${item.name})` : item.name}`)
			.join() + (selectedItem.length - 4 <= 0 ? '' : `, +${selectedItem.length - 4}`)
	const currentOption = options.value?.find(item => item.value === 'designate_employee')
	if (currentOption) {
		currentOption.label = `${originLabel} ` + `${selectedItem.length > 0 ? `【${nameStr}】` : ''}`
		selectedItem.length && emit('getLabel', currentOption.label)
	}
}
// 设置临时下拉项
const setQuerySelectOptions = (selectedItem: any[]) => {
	const field = props.useUserId ? 'innerUserId' : 'salesNo'
	selected.value = selectedItem.map(item => ({
		label: item.nickname ? `${item.nickname} (${item.name})` : item.value || item.name,
		value: item[field] ? item[field] : item.id,
		isDisabled: true
	}))
}
const submit = (selected: any, selectedItem: any[]) => {
	if (props.mode === 'button') return emit('update:modelValue', selected)
	if (selected.length || props.allowEmptySales) {
		emit('update:modelValue', 'designate_employee')
	} else {
		emit('reset')
	}
	emit('update:salesNoList', selected)
}
defineExpose({
	reload
})
</script>
