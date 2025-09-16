<!-- 列表批量查询 -->
<template>
	<elPopover
		:title="title || $t('form.batchQuery')"
		width="400"
		trigger="click"
		placement="bottom-end"
	>
		<div class="popoverContent">
			<!-- 选择器 -->
			<slot></slot>
			<div class="btn-box">
				<!-- 清空 -->
				<elLink class="popoverButton" :underline="false" @click="form.cacheValue = ''">
					{{ $t('button.clear') }}
				</elLink>
				<elButton class="popoverButton" type="primary" :loading="loading" @click="onSearch">
					{{ $t('form.search') }}
				</elButton>
			</div>
			<!-- 查询 -->
			<elForm ref="formRef" :inline="true" :model="form">
				<elFormItem prop="cacheValue">
					<elInput
						v-model="form.cacheValue"
						:autosize="{ minRows: 4, maxRows: 12 }"
						type="textarea"
						:placeholder="$t('form.separateTips')"
					>
					</elInput>
				</elFormItem>
			</elForm>
		</div>

		<!-- append icon -->
		<template #reference>
			<elBadge class="position-right" :hidden="batchCount === 0" :value="batchCount">
				<elButton>
					<!-- 是否有数据 -->
					<el-icon><Plus /></el-icon>
				</elButton>
			</elBadge>
		</template>
	</elPopover>
</template>

<script lang="ts" setup>
import { useForm } from '@/hooks'
const [formRef] = useForm()
defineOptions({
	name: 'BatchInput'
})
const props = defineProps({
	title: {
		type: String,
		default: ''
	},
	// 查询是否加载中
	loading: {
		type: Boolean,
		default: false
	},
	// 传入的值
	value: {
		type: String,
		default: ''
	}
})
const emit = defineEmits(['update:value', 'onSearch'])
const form = ref({ cacheValue: '' })
const onSearch = () => {
	emit('onSearch')
}
// 监听传入的值
watch(
	() => props.value,
	val => {
		form.value.cacheValue = val.replace(/\s/g, '').replace(/,|，/g, '\n').replace(/\n{2}/, '\n')
	},
	{
		immediate: true
	}
)
// 批量的数量
const batchCount = computed(
	() => form.value.cacheValue.replace(/,|，/, '\n').split('\n').filter(Boolean).length
)
// 向外发射数据
watch(
	() => form.value.cacheValue,
	val => {
		emit('update:value', val.replace(/\n/g, ','))
	}
)
</script>

<style lang="scss">
.popoverContent {
	margin: 10px;
	.btn-box {
		display: flex;
		justify-content: flex-end;
	}
	.el-form-item {
		width: 100%;
	}
	.el-form-item__content {
		width: 100%;
	}
	.popoverButton {
		margin-left: 15px;
		margin-bottom: 10px;
	}
}
.position-right .el-badge__content.is-fixed {
	right: 0;
}
.iconfont {
	margin-top: 4px;
}
</style>
