import { withInstall } from '@/utils'
import QuerySelectComp from './src/components/QuerySelect.vue'
import PhoneInputComp from './src/components/PhoneInput.vue'
import OrganizationSelectComp from './src/components/OrganizationSelect.vue'
import DateRangePickerComp from './src/components/DateRangePicker.vue'
import FormComp from './src/Form.vue'

export const QuerySelect = withInstall(QuerySelectComp)
export const PhoneInput = withInstall(PhoneInputComp)
export const OrganizationSelect = withInstall(OrganizationSelectComp)
export const DateRangePicker = withInstall(DateRangePickerComp)
export const Form = withInstall(FormComp)
