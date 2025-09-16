<template>
	<elForm ref="formRef" class="form-container" :inline="true" :model="formModel" :rules="rules">
		<slot name="before" :loading="loading" :data-source="formModel"></slot>
		<elRow :gutter="20">
			<elCol
				v-for="(item, index) in validFormSchema"
				:key="item.prop"
				:class="[toggleClass(index), item.type === 'tag' ? 'hidden!' : 'flex!']"
				:xs="24"
				:sm="12"
				:md="12"
				:lg="12"
				:xl="8"
			>
				<elFormItem
					:label="`${item.label} :`"
					:class="{ 'no-label': !item.label }"
					:prop="item.prop"
					class="flex-1 min-w-0 flex-items-center"
				>
					<template v-if="item.maxRange! > 0 || item.labelTips" #label>
						<span class="flex items-center">
							{{ item.label }}
							<el-tooltip
								v-if="!item.hideTips"
								effect="dark"
								:content="item.labelTips || $t('form.maxRangeTips', { maxRange: item.maxRange! })"
								placement="top"
							>
								<el-icon class="mx-2px"><QuestionFilled /></el-icon>
							</el-tooltip>
							:
						</span>
					</template>
					<slot :name="item.prop" :schema="item" :data-source="formModel">
						<template v-if="item.type === 'input' || !item.type">
							<elInput v-model="formModel[item.prop]" clearable>
								<template v-if="item.multiple" #append>
									<BatchInput
										v-model:value="formModel[item.prop]"
										:loading="loading"
										@onSearch="handleQuery"
									/>
								</template>
							</elInput>
						</template>
						<template v-if="item.type === 'phoneInput'">
							<PhoneInput
								v-model="formModel[item.prop]"
								v-model:prefix="formModel[item.prefix]"
								:isPrefix="item.isPrefix"
							></PhoneInput>
						</template>
						<template v-if="item.type === 'select'">
							<!-- 表单项远程搜索自动搜索不传递默认不自动查询 -->
							<QuerySelect
								:ref="(el: any) => setRefs(el, item.prop)"
								v-model="formModel[item.prop]"
								filterable
								collapse-tags
								collapse-tags-tooltip
								:reserve-keyword="false"
								:formModel="formModel"
								v-bind="item"
								:auto="item.remote ? !!item.auto : true"
								:clearable="item.clearableFn?.(formModel) ?? item.clearable ?? true"
								:params="item.params || (item.paramsFun ? item.paramsFun?.(formModel) : {})"
								@setInit="(val: any) => (item.defaultValue = val)"
								@getOptions="item._resolve?.(true)"
							/>
						</template>
						<template v-if="['datetimerange', 'daterange', 'monthrange'].includes(item.type)">
							<component
								:is="item.custom ? DateRangePicker : ElDatePicker"
								v-model="formModel[item.prop]"
								:unlink-panels="item.unlinkPanels ?? item.type !== 'monthrange'"
								:disabledDate="item.disabledDate || ((date: Date) => disabledDate(date, item))"
								:shortcuts="item.shortcuts || (item.custom ? [] : shortcuts)"
								:default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
								v-bind="omit(item, 'defaultValue', 'label')"
								range-separator="-"
								:useSplit="false"
								:clearable="clearableFn(item)"
								:start-placeholder="$t('form.startPlaceholder')"
								:end-placeholder="$t('form.endPlaceholder')"
								@change="(val: any) => dateCorrection(val, item, formModel)"
								@calendar-change="(dateList: any) => calendarChange(dateList, item)"
								@focus="getPrevValue(item, formModel)"
							/>
						</template>
						<template v-if="['date', 'month', 'year', 'week'].includes(item.type)">
							<elDatePicker
								v-model="formModel[item.prop]"
								class="w-full!"
								:disabledDate="item.disabledDate || ((date: Date) => disabledDate(date, item))"
								v-bind="omit(item, ['defaultValue', 'label'])"
								:type="item.type"
								@change="(val: any) => dateCorrection(val, item, formModel)"
								@focus="getPrevValue(item, formModel)"
							/>
						</template>
						<template v-if="item.type === 'text'">
							<span>{{ formModel[item.prop] }}</span>
						</template>
						<!-- 多选输入框 -->
						<template v-if="item.type === 'selectInput'">
							<elInput v-model="formModel[item.prop]" clearable>
								<template #prepend>
									<elSelect
										v-model="item.prop"
										:style="{
											width: item.prependWidth ? item.prependWidth : `100px`
										}"
									>
										<elOption
											v-for="(optionItem, optionIndex) in item.prependOptions"
											:key="optionIndex"
											:label="optionItem.label"
											:value="optionItem.value!"
										/>
									</elSelect>
								</template>
							</elInput>
						</template>
						<!-- 多选日期选择 -->
						<template v-if="item.type === 'selectDatetimerange'">
							<div class="select-datetime flex w-full">
								<elSelect
									v-model="item.prop"
									:style="{
										width: item.prependWidth ? item.prependWidth : `100px`
									}"
									@change="(val: string) => dateSelectChange(val, item)"
								>
									<elOption
										v-for="(optionItem, optionIndex) in item.prependOptions"
										:key="optionIndex"
										:label="optionItem.label"
										:value="optionItem.value!"
									/>
								</elSelect>
								<elDatePicker
									v-model="formModel[item.prop]"
									class="ml--1px"
									:style="{ maxWidth: `calc(100% - ${item.prependWidth || '100px'} + 1px)` }"
									:unlink-panels="item.unlinkPanels ?? true"
									:shortcuts="item.shortcuts || shortcuts"
									:disabledDate="item.disabledDate || ((date: Date) => disabledDate(date, item))"
									:default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
									:start-placeholder="$t('form.startPlaceholder')"
									:end-placeholder="$t('form.endPlaceholder')"
									v-bind="omit(item, 'defaultValue', 'label')"
									:clearable="clearableFn(item)"
									range-separator="-"
									:type="item.rangeType ? item.rangeType : 'datetimerange'"
									@change="(val: any) => dateCorrection(val, item, formModel)"
									@focus="getPrevValue(item, formModel)"
									@calendar-change="(dateList: [Date, Date]) => calendarChange(dateList, item)"
								/>
							</div>
						</template>
						<!-- 组织架构选择 -->
						<template v-if="item.type === 'organization'">
							<OrganizationSelect
								:ref="(el: any) => setOrganizationRefs(el, item.prop)"
								v-bind="item"
								v-model="formModel[item.prop]"
								v-model:salesNoList="formModel[item.extraProp]"
								@reset="onReset([item.prop])"
							/>
						</template>
					</slot>
				</elFormItem>
			</elCol>
		</elRow>
		<elRow :gutter="20" justify="end">
			<elCol :xs="24" :sm="12" :md="8" :lg="6" :xl="6" class="flex! justify-end pr-32px!">
				<elTag
					v-for="(tagItem, index) in tagFormSchema"
					:key="index"
					class="mr-12px"
					size="large"
					closable
					@close="onResetQuery"
				>
					<span class="font-size-14px">{{ tagItem.label }}</span>
				</elTag>
				<elButton size="default" plain :loading="loading" @click="onResetQuery">{{
					$t('form.reset')
				}}</elButton>
				<elButton size="default" type="primary" :loading="loading" @click="handleQuery">{{
					$t('form.search')
				}}</elButton>
				<div
					:class="toggleBtnClass"
					class="flex items-center ml-4 cursor-pointer text-size-sm color-blue flex-shrink-0"
					@click="toggle = !toggle"
				>
					<span v-if="!toggle">
						{{ $t('form.expansion') }}
						<elIcon class="ml-1"><ArrowDown /></elIcon>
					</span>
					<span v-else>
						{{ $t('form.packUp') }}
						<elIcon class="ml-1"> <ArrowUp /> </elIcon>
					</span>
				</div>
			</elCol>
		</elRow>
	</elForm>
</template>

<script lang="ts" setup>
import 'element-plus/theme-chalk/display.css'
import dayjs from 'dayjs'
import { cloneDeep, isEmpty, isArray, isNumber, omit, flatten } from 'lodash-es'
import { formProps } from './props.ts'
import { padEndStr } from '@/utils'
import {
	useToggle,
	useReset,
	useDateTimePicker,
	useQuerySelect,
	useInitParams,
	useSchemaClearable,
	useRefsMap
} from './utils'
import BatchInput from './components/BatchInput.vue'
import { ElDatePicker } from 'element-plus'
import DateRangePicker from './components/DateRangePicker.vue'
defineOptions({
	name: 'FormComp',
	inheritAttrs: false
})
const props = defineProps(formProps)
const emit = defineEmits(['query', 'setLoading', 'resetSort', 'getFormModel', 'clearSelection'])
const formRef = ref<any>(null)
const formModel = reactive<any>({})

const { shortcuts, disabledDate, calendarChange, dateSelectChange, dateCorrection, getPrevValue } =
	useDateTimePicker()
const { setRefs, clearQuerySelectCache } = useQuerySelect()

const { refsMap, setRefs: setOrganizationRefs } = useRefsMap()
// 获取有效的表单配置
const validFormSchema = computed(() =>
	props.formSchema.filter(item => item?.filterFun?.(item, formModel, props.extraParams) ?? true)
)

const tagFormSchema = computed(() =>
	props.formSchema
		.filter(item => item.type === 'tag')
		.filter(item => item?.filterFun?.(item, formModel, props.extraParams) ?? true)
)

// 根据配置生成阻塞的promise,并暴露resolve 方法
const promiseList = computed(() =>
	validFormSchema.value
		.filter(item => item.isPrecondition && item.url)
		.map(
			item =>
				new Promise(resolve => {
					item._resolve = resolve
				})
		)
)
//当所有的前置条件加载完成，执行回调
const formReady: any =
	promiseList.value.length > 0 ? Promise.all(promiseList.value) : { then: (fn: any) => fn() }
// 展开收起逻辑
const { toggle, toggleBtnClass, toggleClass } = useToggle(props.defaultExpand, validFormSchema)
// 表单初始化和重置逻辑
const { onReset, init } = useReset(validFormSchema, formModel, formReady)
// 表单路由带参处理和带参自动清空参数逻辑【warning:直接传入props.initParams 会失去响应式】
useInitParams(validFormSchema, formModel, props, onReset)
// 表单项clearable是否可清空
const { clearableFn } = useSchemaClearable(validFormSchema, formModel, onReset)

// 默认查询一次
onMounted(() => {
	nextTick(() => {
		formReady.then(() => {
			props.autoQuery && handleQuery()
		})
	})
})
// 处理查询参数
const handleParams = () => {
	const params = formModel
	const allowEmptyKeyList: string[] = []
	// 过滤掉不需要展示的字段,timeFormat 格式化时间类型['YYYY-HH-DD']，不传默认为毫秒,参考dayjs https://dayjs.gitee.io/docs/zh-CN/parse/string-format
	const displayProps = validFormSchema.value.map(
		({
			type = 'input',
			prop,
			prefix,
			spliceCommas = false,
			timeFormat,
			multiple,
			extraProp,
			allowEmpty = false
		}) => ({
			type,
			prop,
			prefix,
			spliceCommas,
			timeFormat,
			multiple,
			extraProp,
			allowEmpty
		})
	)
	let result: any = cloneDeep(props.extraParams)
	// 处理特殊字段
	displayProps.forEach(item => {
		if (item.allowEmpty) allowEmptyKeyList.push(item.prop)
		if (['datetimerange', 'selectDatetimerange', 'daterange', 'monthrange'].includes(item.type)) {
			if (params[item.prop]?.length === 2) {
				// 格式化时间
				const [start, end] = params[item.prop].map((date: Date) => {
					// 默认返回毫秒
					if (!item.timeFormat) return dayjs(date).toDate().getTime()
					return dayjs(date).format(item.timeFormat)
				})
				if (props.formatDateTime) {
					result[`${padEndStr(item.prop, 'start')}`] = start
					result[`${padEndStr(item.prop, 'end')}`] = end
				} else {
					result[item.prop] = [start, end]
				}
			}
		} else if (item.type === 'phoneInput') {
			params[item.prop] && (result[item.prop] = params[item.prop])
			if (params[item.prop]?.trim()) {
				params[item.prefix] && (result[item.prefix] = params[item.prefix])
			}
		} else if (['date', 'month', 'year', 'week'].includes(item.type)) {
			const date = params[item.prop]
			if (date) {
				result[item.prop] = !item.timeFormat
					? params[item.prop]?.getTime()
					: dayjs(date).format(item.timeFormat)
			}
			// 批量输入框
		} else if (item.type === 'input' && item.multiple) {
			result[item.prop] = params[item.prop].split(',').filter(Boolean)
		} else if (item.type === 'organization') {
			result[item.prop] = params[item.prop]
			result[item.extraProp] = params[item.extraProp]
		} else {
			if (!isEmpty(params[item.prop]) || item.allowEmpty || isNumber(params[item.prop])) {
				result[item.prop] = isArray(params[item.prop])
					? item.spliceCommas
						? params[item.prop].join(',')
						: params[item.prop]
					: params[item.prop]
			}
		}
	})
	// 查询前的前置函数
	result = props.beforeQuery?.(result) || result
	// 处理string类型额外的空格
	Object.keys(result).forEach(key => {
		if (typeof result[key] === 'string') {
			result[key] = result[key].trim()
			if (!result[key] && !allowEmptyKeyList.includes(key)) delete result[key]
		} else if (Object.is(NaN, result[key])) {
			console.warn(`${key}的值不合法`)
			delete result[key]
		}
	})
	return result
}
// 查询
const handleQuery = () => {
	emit('setLoading', true)
	formRef.value.validate((valid: boolean) => {
		if (!valid) return emit('setLoading', true)
		let params = handleParams()
		emit('query', params)
	})
}
// 向外暴露formModel
let lastFormModel = {}
watch(
	() => formModel,
	val => {
		emit('getFormModel', formModel, lastFormModel)
		lastFormModel = cloneDeep(val)
	},
	{
		deep: true,
		immediate: true
	}
)
// 重置并查询
const onResetQuery = () => {
	onReset()
	emit('resetSort')
	emit('clearSelection')
	handleQuery()
}
// 暴露的方法
defineExpose({
	// 获取参数
	getParams: handleParams,
	onReset,
	onResetQuery,
	clearQuerySelectCache,
	// 手动初始化form 表单,fillForm 为true会用默认值填充表单
	init,
	formReady,
	reload: (props: string[]) => Promise.all(props.map(prop => refsMap[prop]?.reload?.()))
})
</script>
<style lang="scss">
.select-datetime {
	.el-select {
		color: var(--el-color-info);
		background-color: var(--el-fill-color-light);
		.el-select__wrapper {
			background-color: transparent;
			border-right-color: transparent;
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
			transition: z-index 0.3s;
			&.is-focused,
			&:hover {
				z-index: 1;
			}
		}
	}
	.el-date-editor {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
}
.el-form-item.no-label {
	.el-form-item__label {
		display: none;
	}
}
</style>
