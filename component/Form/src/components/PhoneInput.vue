<template>
	<div class="phone-input w-full">
		<elInput v-model.trim="value" :placeholder="props.placeholder">
			<template v-if="props.isPrefix" #prepend>
				<elSelect
					v-model="prefixValue"
					placeholder="Select"
					:style="{
						width: props.prependWidth
					}"
				>
					<elOption
						v-for="(item, index) in props.prefixList"
						:key="index"
						:value="item!"
						:label="`+${item}`"
					></elOption>
				</elSelect>
			</template>
		</elInput>
	</div>
</template>

<script setup lang="ts">
import { phoneInputProps } from '../props'

defineOptions({
	name: 'PhoneInput',
	inheritAttrs: false
})
const props = defineProps(phoneInputProps)
const emit = defineEmits(['update:modelValue', 'update:prefix'])

const value = computed({
	get: () => props.modelValue,
	set: val => {
		emit('update:modelValue', val)
	}
})
const prefixValue = computed({
	get: () => props.prefix,
	set: val => {
		emit('update:prefix', val)
	}
})
</script>
