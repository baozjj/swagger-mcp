<template>
	<Modal
		:title="title"
		width="800px"
		:confirmButtonDisabled="!clearable && !salesSelected.length && !allowEmptySales"
		append-to-body
		@register="register"
		@cancel="closeModal"
		@confirm="confirm"
	>
		<!-- 避免内存组件触发外层校验，通过elFormItem隔离 -->
		<elFormItem :required="false" class="custom-form-item shallow-scrollbar">
			<div class="left-container flex-1 min-w-0 h-full">
				<div class="input-container">
					<elInput
						v-model="label"
						placeholder="请输入关键字,可按enter查询"
						clearable
						:disabled="selectableMode === 'dept'"
						@keyup.enter="getUserListInfo"
					>
						<template #append>
							<el-button
								icon="Search"
								:disabled="selectableMode === 'dept'"
								@click="getUserListInfo"
							/>
						</template>
					</elInput>
				</div>
				<div class="bread-box">
					<span class="line-height-normal">
						<elLink
							v-for="(item, index) in pageList"
							:key="item.id"
							:underline="false"
							:type="isSearch ? 'primary' : index !== pageList.length - 1 ? 'primary' : 'default'"
							@click="jumpPage(index)"
						>
							/{{ item.value }}
						</elLink></span
					>
				</div>
				<div class="dept-container">
					<elCheckboxGroup v-model="salesSelected">
						<template v-if="!isSearch">
							<elCheckboxGroup v-model="deptSelected">
								<div
									v-for="item in currentData.children"
									:key="item.id"
									class="flex items-center justify-between h-42px cursor-pointer"
									:class="{
										'cursor-not-allowed': !checkHasChild(item)
									}"
									@click="checkHasChild(item) && nextPage(item)"
								>
									<elCheckbox
										v-if="['all', 'dept'].includes(selectableMode)"
										:class="{ '': !!getChecked(item) }"
										:value="item.id"
										:indeterminate="item.indeterminate"
										@click.stop
										@change="(bool: boolean) => departChange(bool, item)"
									>
										<span></span>
									</elCheckbox>
									<SvgIcon
										:iconStyle="{ width: '26px', height: '26px' }"
										class="color-#fff flex-shrink-0 p-4px mr-10px text-12px bg-#5a69e1 rounded-full ml-3px mr-13px"
										name="organization"
									></SvgIcon>
									<div
										class="flex-1 min-w-0 flex items-center line-height-normal text-14px cursor-pointer"
									>
										<TextEllipsis :text="item.data.name" :line="1" popperClass="max-w-300px" />
										<div class="ml-1">
											{{ item.data.memberCount ? `(${item.data.memberCount})` : '' }}
										</div>
									</div>
									<ElButton v-if="checkHasChild(item)" class="border-none!" icon="ArrowRight" plain>
									</ElButton>
								</div>
							</elCheckboxGroup>
						</template>
						<template v-if="['all', 'sales'].includes(selectableMode)">
							<elCheckbox
								v-for="item in isSearch ? userList : currentData.userList"
								:key="item[field]"
								:disabled="disabledSalesNoList.includes(item[field])"
								class="flex! mb-10px items-center h-42px"
								:value="item[field]"
							>
								<div class="flex">
									<elImage
										:src="item.avatar && item.avatar.avatar72"
										class="w-32px rounded-full"
										:alt="item[field]"
									/>
									<div class="flex items-center">
										<div class="ml-10px">
											{{ item.nickname ? `${item.nickname} (${item.name})` : item.name }}
										</div>
										<div class="ml-10px">
											{{ item.title }}
										</div>
									</div>
								</div>
							</elCheckbox>
						</template>
					</elCheckboxGroup>
					<elEmpty
						v-if="isSearch && !userList.length"
						description="未查询到相关员工~"
						:image-size="60"
					/>
				</div>
			</div>
			<div class="right-container flex-1">
				<div class="flex items-center justify-between selected-operate">
					<span v-show="submitData.length"
						>已选{{ submitData.length }}个{{ selectableMode === 'dept' ? '部门' : '人员' }}</span
					>
					<elLink
						class="ml-auto"
						:underline="false"
						:type="submitData.length ? 'primary' : 'default'"
						:disabled="!submitData.length"
						@click="submitData = []"
						>{{ $t('button.clear') }}</elLink
					>
				</div>
				<div class="selected-container shallow-scrollbar flex-wrap flex-gap-10px flex-self-auto">
					<elTag
						v-for="tag in submitData"
						:key="tag"
						closable
						close
						type="info"
						@close="handleClose(tag)"
					>
						{{ getName(tag) }}
					</elTag>
				</div>
			</div>
		</elFormItem>
	</Modal>
</template>

<script setup lang="ts">
import { getDeptInfoTree, getUserList, getAllDeptInfoTree, getAllUserList } from '@/api/user'
import { useModalInner } from '@/hooks'
import { querySelectProps, organizationSelectProps, organizationSelectModalProps } from '../props'
import { cloneDeep, isEqual, pick, difference } from 'lodash-es'
const props = defineProps({
	...pick(querySelectProps, ['clearable']),
	...organizationSelectProps,
	...organizationSelectModalProps
})
const emit = defineEmits(['register', 'submit', 'setLabel'])
const label = ref('')
// 选择的销售
const salesSelected = ref<any>([])
// 选择的部门
const deptSelected = ref<any>([])
const pageList = ref<any>([])
const originMap: any = new Map()
const userList = ref([])
const isSearch = ref(false)
const currentData = reactive<any>({
	children: [],
	userList: []
})
const field = props.useUserId ? 'innerUserId' : 'salesNo'
const [register, { closeModal, changeLoading }] = useModalInner(() => {})
// 提交内容
const submitData = computed({
	get() {
		if (props.selectableMode === 'dept') {
			return deptSelected.value
		} else {
			return salesSelected.value
		}
	},
	set(value) {
		if (props.selectableMode === 'dept') {
			deptSelected.value = value
		} else {
			salesSelected.value = value
		}
	}
})
// 获取用户列表
const getUserListInfo = () => {
	isSearch.value = true
	// whole 完整的, 当为true 则查整个组织架构人员
	const { filterPerm } = props
	const requestApi = props.whole && props.useUserId ? getAllUserList : getUserList
	requestApi({ keyword: label.value, filterPerm }).then(res => {
		userList.value = res.data
	})
}
// 移除不存在的销售编号
const removeNotExistSales = () => {
	submitData.value = props.salesNoList.filter((key: string) =>
		originMap.keys().toArray().includes(key)
	)
	if (props.dataPerm === 'designate_employee') {
		emit('submit', cloneDeep(submitData.value))
	}
}
// 设置外界label信息
const setOutLabel = () => {
	if (originMap.size) {
		emit('setLabel', submitData.value.map((id: string) => originMap.get(id)).filter(Boolean))
	}
}
// 递归设置映射
const setOriginMap = (node: any) => {
	for (const user of node.data?.userList || []) {
		originMap.set(user[field], user)
	}
	for (const child of node.children || []) {
		originMap.set(child.id, child)
		setOriginMap(child)
	}
}
// 获取组织架构信息
const getBaseInfo = () => {
	currentData.userList = []
	const { filterPerm } = props
	originMap.clear()
	return new Promise((resolve, reject) => {
		// whole 完整的, 当为true 则取整个组织架构树
		const requestApi = props.whole && props.useUserId ? getAllDeptInfoTree : getDeptInfoTree
		// 判断是否需要权限过滤
		requestApi({ filterPerm }).then((res: any) => {
			if (res.code !== '0000') return
			currentData.children = [...res.data]
			pageList.value = [
				{
					id: 999999,
					children: cloneDeep(res.data),
					data: {
						userList: []
					},
					value: 'Photon Dance Technology Limited'
				}
			]
			setOriginMap(pageList.value[0])
			setOutLabel()
			props.mode === 'select' && removeNotExistSales()
			resolve(true)
		})
	})
}
getBaseInfo()
// 监听销售人员变动
watch(
	() => props.salesNoList,
	(val, oldVal) => {
		if (Array.isArray(val) && !isEqual(val, oldVal)) {
			submitData.value = cloneDeep(val)
			setOutLabel()
		}
	},
	{
		immediate: true
	}
)
// 监听sales 实时变化
let prev: any = []
watch(
	() => submitData.value,
	(cur: any) => {
		const diffIds = prev.length > cur.length ? difference(prev, cur) : difference(cur, prev)
		for (const deptId of getParentId(diffIds)) {
			const allChildStatus = Object.values(getChecked(originMap.get(deptId)))
			const allChildTrue = !!allChildStatus.length && allChildStatus.every((v: any) => v)
			if (allChildTrue) {
				!deptSelected.value.includes(deptId) && deptSelected.value.push(deptId)
			} else {
				deptSelected.value = deptSelected.value.filter((v: any) => v !== deptId)
			}
		}
		prev = cloneDeep(cur)
	},
	{
		deep: true
	}
)

// 获取更多parentId
const getParentId = (val: any) => {
	let pidList: any = []
	for (const item of val) {
		if (originMap.get(item)) {
			const { departmentIds, parentId } = originMap.get(item)
			if (!parentId && !departmentIds) {
				return pidList
			}
			pidList = [...new Set(pidList.concat(parentId ? [parentId] : departmentIds))]
		}
	}
	if (pidList.length) {
		pidList = [...new Set(pidList.concat(getParentId(pidList)))]
	}
	return pidList
}
// 检查是否含有子节点
const checkHasChild = (item: any) => {
	if (props.selectableMode === 'dept') {
		return item.children && item.children.length
	}
	return item.data.userList.length > 0 || (item.children && item.children.length)
}
// 下一级
const nextPage = (item: any) => {
	// 存储页面数据
	pageList.value.push(item)
	const children = item.children || []
	currentData.children = [...children]
	currentData.userList = [...item.data.userList]
}
// 面包页切换
const jumpPage = (index: number) => {
	isSearch.value = false
	label.value = ''
	const obj = pageList.value[index]
	obj.children && (currentData.children = [...obj.children])
	obj.data?.userList && (currentData.userList = [...obj.data.userList])
	pageList.value.length = index + 1
}
// 删除销售
const handleClose = (tag: any) => {
	if (props.selectableMode === 'dept') departChange(false, originMap.get(tag))
	submitData.value.splice(submitData.value.indexOf(tag), 1)
}
// 获取人员及部门名字
const getName = (id: number) => {
	const item = originMap.get(id)
	if (!item) return id
	// 获取部门名称
	if (item.parentId || item.id === '0') return item.value
	// 获取销售名称
	return item ? (item.nickname ? `${item.nickname} (${item.name})` : `${item.name}`) : id
}
// 部门变化
const departChange = (val: boolean, item: any) => {
	const { salesNoList, deptIdList } = getAllChildIds(item)
	if (val) {
		salesSelected.value = [...new Set([...salesSelected.value, ...salesNoList])]
		deptSelected.value = [...new Set([...deptSelected.value, ...deptIdList])]
	} else {
		salesSelected.value = salesSelected.value.filter((v: string) => !salesNoList.includes(v))
		deptSelected.value = deptSelected.value.filter((v: string) => !deptIdList.includes(v))
	}
}
// 获取部门下的子节点
const getAllChildIds = (node: any): any => {
	let salesNoList = [],
		deptIdList = []
	for (const user of node.data?.userList || []) {
		if (!props.disabledSalesNoList.includes(user[field])) {
			salesNoList.push(user[field])
		}
	}
	if (node.children) {
		for (const child of node.children) {
			deptIdList.push(child.id)
			salesNoList = salesNoList.concat(getAllChildIds(child)['salesNoList'])
			deptIdList = deptIdList.concat(getAllChildIds(child)['deptIdList'])
		}
	}
	return { salesNoList, deptIdList }
}
// 获取半选状态
const getChecked = (node: any) => {
	if (!node) return {}
	let flagMap: any = {}
	if (props.selectableMode !== 'dept') {
		for (const user of node?.data?.userList || []) {
			if (!props.disabledSalesNoList.includes(user[field])) {
				flagMap[user[field]] = salesSelected.value.includes(user[field])
			}
		}
	}

	for (const child of node.children || []) {
		flagMap[child.id] = deptSelected.value.includes(child.id)
		Object.assign(flagMap, getChecked(child))
	}
	const trueCount = Object.values(flagMap).filter(v => v).length
	const allCount = Object.keys(flagMap).length
	// 设置半选状态
	node.indeterminate = !!(trueCount && trueCount !== allCount)
	return flagMap
}

const confirm = () => {
	changeLoading(true)
	emit('submit', cloneDeep(submitData.value))
	closeModal()
	changeLoading(false)
}
defineExpose({
	reload: getBaseInfo
})
</script>
<style lang="scss">
.custom-form-item {
	.el-form-item__content {
		display: flex;
		align-items: unset;
		height: 400px;
		line-height: normal;
	}
}
.left-container {
	display: flex;
	flex-direction: column;
	border: 1px solid #ccc;
	border-top-left-radius: 4px;
	border-bottom-left-radius: 4px;

	.input-container,
	.bread-box {
		padding: 8px;
		border-bottom: 1px solid #ccc;
	}

	.dept-container {
		flex: 1;
		min-width: 0;
		padding: 8px;
		overflow-y: auto;
	}
	.el-checkbox {
		display: flex;
		align-items: center;
		padding: 10px 0;
		margin-right: 0;
		.el-checkbox__inner {
			width: 16px;
			height: 16px;

			/* border-radius: 50%; */
			&::after {
				top: 2px;
				left: 5px;
			}
		}
	}
}
.right-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	border: 1px solid #ccc;
	border-left: none;
	border-top-right-radius: 4px;
	border-bottom-right-radius: 4px;
	.selected-operate {
		padding: 8px;
		line-height: 32px;
		border-bottom: 1px solid #ccc;
	}
	.selected-container {
		display: flex;
		min-width: 0;
		padding: 8px;
		overflow: hidden auto;
	}
}
</style>
