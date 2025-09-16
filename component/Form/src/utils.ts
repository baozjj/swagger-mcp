import { cloneDeep, isEmpty, flatten, isNumber, isArray, intersection, pick } from 'lodash-es'
import { getDateRange } from '@/utils'
import dayjs, { ManipulateType } from 'dayjs'
import { FormSchema } from './type.ts'
import { useI18n, useUserStore } from '@/hooks'
const unitMap: Record<string, ManipulateType> = {
	monthrange: 'month',
	yearrange: 'year'
}
const getUnit = (item: any) => {
	return unitMap[item.type] || 'day'
}
/*
 * @description 计算离今天几天的日期
 * @param {Number} days 离今天几天的日期
 * @return {Date} 日期
 */
const dateFromToday = (days: number | undefined) => {
	if (!days) {
		return dayjs().endOf('day').toDate()
	} else {
		return dayjs().add(parseInt(days), 'day').endOf('day').toDate()
	}
}

// 展开收起相关逻辑
export function useToggle(defaultValue = false, validFormSchema: Ref<FormSchema[]>) {
	const toggle = ref(defaultValue)
	// el-row 自定义显示隐藏
	const toggleClass = computed(() =>
		toggle.value
			? () => ({})
			: (index: number) => ({
					'hidden-xs-only': index > 1,
					'hidden-sm-only': index > 3,
					'hidden-md-only': index > 3,
					'hidden-lg-only': index > 3,
					'hidden-xl-only': index > 5
				})
	)
	const toggleBtnClass = computed(() => {
		const formSchemaLen = validFormSchema.value.length
		return {
			'hidden-xs-only': formSchemaLen <= 2,
			'hidden-sm-only': formSchemaLen <= 4,
			'hidden-md-only': formSchemaLen <= 4,
			'hidden-lg-only': formSchemaLen <= 4,
			'hidden-xl-only': formSchemaLen <= 6
		}
	})
	return { toggle, toggleClass, toggleBtnClass }
}
// 重置表单相关逻辑及初始化表单项配置
export function useReset(validFormSchema: Ref<FormSchema[]>, formModel: any, formReady: any) {
	// 初始化表单数据
	const initFormModel: Record<string, any> = {}
	// 是否填充form
	const init = (fillForm = false) => {
		validFormSchema.value.forEach(item => {
			if (
				['selectInput', 'selectDatetimerange'].includes(item.type) &&
				item?.prependOptions?.length
			) {
				const initValueMap: any = {
					selectInput: '',
					selectDatetimerange: []
				}
				item.prependOptions.forEach(child => {
					initFormModel[child.value as string] = initValueMap[item.type] || ''
					// 初始化表单临时变量
					if (item.prop === child.value) {
						item._maxRange = child?.maxRange
						item._ignore = child.ignore || false
					}
				})
			}
			if (!item.type || ['input', 'selectInput'].includes(item.type)) {
				initFormModel[item.prop] = item.defaultValue || ''
			} else if (item.type === 'select') {
				initFormModel[item.prop] = item.defaultValue || (item.multiple ? [] : '')
			} else if (
				['datetimerange', 'selectDatetimerange', 'daterange', 'monthrange'].includes(item.type)
			) {
				// 动态设置最大截止日期
				item._end = dateFromToday(item.daysFromToday)
				// 数组类型且长度为2或数值类型或子option存在默认值,进行日期范围处理,
				const childHasDefaultValue = (item.prependOptions || []).filter(child => child.defaultValue)
				if (
					(isArray(item.defaultValue) && item.defaultValue?.length === 2) ||
					isNumber(item.defaultValue) ||
					childHasDefaultValue.length
				) {
					// 兼容日期默认值为数字的默认值
					const defaultValueFun = (defaultValue: number | [Date, Date]) =>
						isNumber(defaultValue) ? getDateRange(defaultValue as number) : defaultValue

					if (item.type === 'selectDatetimerange') {
						item.prependOptions!.forEach((child: any) => {
							initFormModel[child.value] =
								defaultValueFun(child.defaultValue) || defaultValueFun(item.defaultValue)
						})
					} else {
						initFormModel[item.prop] = defaultValueFun(item.defaultValue)
					}
				} else {
					initFormModel[item.prop] = []
				}
			} else if (item.type === 'phoneInput') {
				initFormModel[item.prop] = ''
				initFormModel[item.prefix] = item.defaultPrefix
			} else if (['date', 'month', 'year', 'week'].includes(item.type)) {
				// 动态设置最大截止日期
				item._end = dateFromToday(item.daysFromToday)
				initFormModel[item.prop] = item.defaultValue || ''
			} else if (item.type === 'organization') {
				const { userInfo } = useUserStore()
				initFormModel[item.prop] = item.defaultValue || userInfo?.dataPerm
				initFormModel[item.extraProp] = []
			} else if (item.type === 'tag') {
				initFormModel[item.prop] = item.defaultValue || ''
			}
		})
		if (fillForm) {
			for (const [key, value] of Object.entries(initFormModel)) {
				formModel[key] = value
			}
		}
	}
	// 保存初始化数据
	// 初次初始化
	init(true)
	// 异步初始化,不重新赋值表单
	formReady.then(() => init())

	/*
	 * 重置表单
	 * @param {Array} props 需要重置的表单项
	 * @param {Any} value 重置的值,不传值则为默认值
	 */
	const onReset = (props?: any, value?: any) => {
		Object.keys(initFormModel).forEach(key => {
			if (isEmpty(props)) {
				formModel[key] = initFormModel[key]
			} else {
				if (Array.isArray(props) && props.includes(key)) {
					formModel[key] = value ?? initFormModel[key]
				}
			}
		})
	}
	// 配置发生变化则重新生成默认值
	watch(
		() => validFormSchema.value,
		() => {
			init()
		}
	)

	return { onReset, initFormModel, init }
}
// datepicker相关逻辑
export const useDateTimePicker = () => {
	const { t } = useI18n()
	// dateTimePicker 快捷操作
	const shortcuts = [
		{
			text: t('word.nearlySevenDays'),
			value: () => getDateRange(7)
		},
		{
			text: t('word.nearlyOneMonth'),
			value: () => getDateRange(30)
		},
		{
			text: t('word.nearlyThreeMonths'),
			value: () => getDateRange(90)
		}
	]
	/*
	 * @param {Date} date 当前日期
	 * @param {Number} item._maxRange 最大选择区间
	 * @param {Date} item._tempStart 选择的开始时间
	 * @param {Boolean} item._clearFlag 是否清空
	 * @param {Boolean} item._ignore 当前项是否忽略大表限制
	 * @param {Date} item._minDate 最小可选时间
	 * @param {Date} item._maxDate 最大可选时间
	 * @param {Date} item._end 最大可选时间
	 * @return {Boolean} 是否禁用
	 */
	const disabledDate = (
		date: Date,
		{
			_maxRange = -1,
			_tempStart,
			_clearFlag = false,
			_ignore = false,
			_minDate,
			_maxDate,
			_end
		}: any
	): boolean => {
		// 当 (未设置最大选择区间时 | 未设置开始日期时 | 可清除标记为true | 忽略此props配置时)，只判断是否大于今天
		if (_maxRange === -1 || !_tempStart || _clearFlag || _ignore) {
			return date > _end
		} else {
			return date < _minDate || date > _maxDate
		}
	}
	/*
	 * 设置datepicker点击的开始时间
	 * @param {Date} dateList 当前项prop
	 * @param {Object} item 当前项
	 */
	const calendarChange = (dateList: [Date, Date], item: FormSchema) => {
		const unit = getUnit(item)
		item._maxRange = item._maxRange || item.maxRange
		// 获取当前选中第一项时间
		item._tempStart = dateList[0]
		// 当选择完整个时间区间时，清空第一项
		if (dateList[1]) delete item._tempStart
		if (item._tempStart) {
			const { _maxRange, _tempStart, _end }: any = item
			// 最大选择区间
			const maxDate = dayjs(_tempStart)
				.add(_maxRange - 1, unit)
				.toDate()
			// 最小选择区间
			item._minDate = dayjs(_tempStart)
				.subtract(_maxRange - 1, unit)
				.toDate()
			// 最大选择区间不能超过今天
			item._maxDate = maxDate.getTime() > _end.getTime() ? _end : maxDate
		}
	}
	/*
	 * 设置当前项的临时变量
	 * @param {String} prop 当前项prop
	 * @param {Object} item 当前项
	 */
	const dateSelectChange = (prop: string, item: FormSchema) => {
		// 获取当前选中项
		const targetPropItem = item.prependOptions?.find((child: any) => child.value === prop)
		// 表单prependOption 切换时，需要重新设置当前项的临时变量
		item._ignore = targetPropItem?.ignore || false
		item._maxRange = targetPropItem?.maxRange
	}
	/*
	 * 日期修正,当输入的时间大于可选时间最大区间时，修正时间为上次选择时间
	 * @param {Array} dateList 当前项prop
	 * @param {Object} item 当前项
	 * @param {Object} formModel 当前表单数据
	 */
	const dateCorrection = (val: any, item: FormSchema, formModel: any) => {
		const unit = getUnit(item)
		if (item.onChange) item.onChange?.(val, formModel)
		// 处理最大区间
		const { _maxRange, maxRange, _end } = item
		// 是否超过区间
		let isMoreThan = false
		const tempMaxRange = _maxRange || maxRange
		if (isArray(val) && val.length === 2) {
			const [startDate, endDate] = val
			isMoreThan = dayjs(endDate).toDate().getTime() > _end.getTime()
			if (tempMaxRange > 0) {
				isMoreThan = dayjs(endDate).diff(dayjs(startDate), unit) + 1 > tempMaxRange || isMoreThan
			}
			if (isMoreThan && item._lastValue) {
				formModel[item.prop] = item._lastValue
				return
			}
		}
		item._lastValue = formModel[item.prop]
	}
	/*
	 * 记录修改前的值
	 * @param {Object} item 当前项
	 * @param {Object} formModel 当前表单数据
	 */
	const getPrevValue = (item: FormSchema, formModel: any) => {
		item._lastValue = formModel[item.prop]
	}
	return { disabledDate, calendarChange, dateSelectChange, shortcuts, dateCorrection, getPrevValue }
}

// refsMap
export const useRefsMap = () => {
	// 设置ref 值
	const refsMap = reactive<any>({})
	const setRefs = (el: any, prop: string) => {
		if (refsMap[prop]) return
		refsMap[prop] = ref(el)
	}
	return { refsMap, setRefs }
}

// querySelect 缓存重置逻辑
export const useQuerySelect = () => {
	const { refsMap, setRefs } = useRefsMap()
	// 手动重置querySelect 缓存
	const clearQuerySelectCache = (props: string[]) => {
		const intersectionProps = intersection(props, Object.keys(refsMap))
		intersectionProps.forEach((prop: string) => {
			refsMap[prop].getOptions(true)
		})
	}
	return { setRefs, clearQuerySelectCache }
}

// form表单路由带参数初始化，及路由带参自动清除相关字段的相关逻辑，参考：https://finance1.dev.photontech.cc/reconciliationManage/errorManage?diffUkNoList=DF1724395726232477697,DF1724395726232477696
export const useInitParams = (
	validFormSchema: Ref<FormSchema[]>,
	formModel: any,
	props: any,
	onReset: any
) => {
	// 构建需要自动清除的字段映射
	const autoClearPropsSchemaMap = computed(() =>
		validFormSchema.value
			.filter(item => item.autoClearProps?.length)
			.reduce((acc: any, cur: FormSchema) => {
				cur.autoClearProps?.forEach((prop: string) => {
					acc[prop] = acc[prop] ? [...acc[prop], cur.prop] : [cur.prop]
				})
				return acc
			}, {})
	)

	// 构建预置选项映射
	const prependOptionsMap = computed(() =>
		validFormSchema.value
			.filter(item => item.prependOptions?.length)
			.reduce((acc: any, cur: FormSchema) => {
				cur.prependOptions?.forEach(option => {
					if (option.value !== undefined) {
						acc[option.value] = cur
					}
				})
				return acc
			}, {})
	)

	// 监听初始化参数
	watch(
		() => props.initParams,
		val => {
			if (!val) return

			// 获取组合属性
			const combinationProps = Object.keys(autoClearPropsSchemaMap.value)
				.filter(key => key.includes(','))
				.map(key => key.split(','))

			const prependOptionsMapKeys = Object.keys(prependOptionsMap.value)

			// 处理每个初始化参数
			Object.entries(val).forEach(([key, value]) => {
				// 设置表单值
				formModel[key] = value

				// 处理预置选项
				if (prependOptionsMapKeys.includes(key)) {
					prependOptionsMap.value[key].prop = key
				}

				// 处理自动清除逻辑
				if (flatten(combinationProps).includes(key)) {
					// 处理组合属性
					const clearProps = combinationProps.reduce((acc: any[], item) => {
						if (item.every(prop => val[prop])) {
							return [...acc, ...autoClearPropsSchemaMap.value[item.join(',')]]
						}
						return acc
					}, [])
					clearProps.length && onReset(clearProps, '')
				} else if (autoClearPropsSchemaMap.value[key]) {
					// 处理单个属性
					onReset(autoClearPropsSchemaMap.value[key], '')
				}
			})
		},
		{ immediate: true }
	)
}

// form表单配置项是否可清除，参考：https://finance1.dev.photontech.cc/depositManage/statementDetail
export const useSchemaClearable = (
	validFormSchema: Ref<FormSchema[]>,
	formModel: any,
	onReset: any
) => {
	// 判断表单项是否可清除
	const clearableFn = (item: FormSchema) => {
		// 缓存需要重置的字段
		if (!item._resetProps) {
			item._resetProps = item.prependOptions
				? item.prependOptions.filter(child => !child.ignore).map(child => child.value)
				: [item.prop]
		}

		// 如果没有关联字段或当前字段被忽略,直接返回clearable配置
		const clearableProps = item?.clearableProps
		if (!clearableProps?.length || item._ignore) {
			return item.clearable ?? true
		}

		// 获取关联的表单配置
		const targetSchema = validFormSchema.value.filter(child =>
			flatten(clearableProps).includes(child.prop)
		)

		// 获取组合属性
		const combinationProps = clearableProps.filter(isArray) as unknown as string[][]

		// 判断关联字段是否有值
		const hasClearableValue = targetSchema.some(child => {
			const value = formModel[child.prop]
			const trimmedValue = typeof value === 'string' ? value.trim() : value

			// 处理组合属性
			if (flatten(combinationProps).includes(child.prop)) {
				return combinationProps.some(props =>
					props.every(prop => {
						const propValue = formModel[prop]
						return !isEmpty(typeof propValue === 'string' ? propValue.trim() : propValue)
					})
				)
			}

			// 处理单个属性
			return !isEmpty(trimmedValue)
		})

		// 当上次可清除且当前不可清除时,重置空值字段
		if (item._lastClearFlag && !hasClearableValue) {
			const emptyProps = item._resetProps.filter((prop: string) => !formModel[prop]?.length)
			if (emptyProps.length) {
				onReset(emptyProps)
			}
		}

		item._lastClearFlag = hasClearableValue
		return hasClearableValue
	}

	return { clearableFn }
}
