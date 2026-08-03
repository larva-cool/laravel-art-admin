<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="配置名称" prop="name">
        <ElInput v-model="form.name" placeholder="请输入配置名称" clearable />
      </ElFormItem>
      <ElFormItem label="配置键名" prop="key">
        <ElInput
          v-model="form.key"
          placeholder="请输入配置键名（如 system.title）"
          :disabled="isEdit"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="配置值" prop="value">
        <ElInput
          v-if="form.input_type === 'textarea'"
          v-model="form.value"
          type="textarea"
          :rows="3"
          placeholder="请输入配置值"
        />
        <ElInput
          v-else-if="form.input_type === 'int' || form.input_type === 'float'"
          v-model="form.value"
          type="number"
          placeholder="请输入数字"
        />
        <ElSwitch
          v-else-if="form.input_type === 'bool'"
          v-model="form.value"
          active-value="1"
          inactive-value="0"
        />
        <ElInput v-else v-model="form.value" placeholder="请输入配置值" clearable />
      </ElFormItem>
      <ElFormItem label="值类型" prop="cast_type">
        <ElSelect v-model="form.cast_type" placeholder="请选择值类型" style="width: 100%">
          <ElOption label="字符串" value="string" />
          <ElOption label="整型" value="int" />
          <ElOption label="浮点型" value="float" />
          <ElOption label="布尔型" value="bool" />
          <ElOption label="JSON" value="json" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="输入类型" prop="input_type">
        <ElSelect v-model="form.input_type" placeholder="请选择输入类型" style="width: 100%">
          <ElOption label="文本框" value="string" />
          <ElOption label="文本域" value="textarea" />
          <ElOption label="数字" value="int" />
          <ElOption label="开关" value="bool" />
          <ElOption label="下拉选择" value="select" />
          <ElOption label="单选" value="radio" />
          <ElOption label="复选" value="checkbox" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="配置参数" prop="param">
        <ElInput
          v-model="form.param"
          type="textarea"
          :rows="2"
          placeholder="JSON 格式参数（如 select 的 options）"
        />
      </ElFormItem>
      <ElFormItem label="排序" prop="sort">
        <ElInputNumber v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput v-model="form.remark" placeholder="请输入备注" clearable />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateSetting, fetchUpdateSetting } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'SettingEditDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑配置' : '新增配置'))

  const form = reactive({
    name: '',
    key: '',
    value: '' as string,
    cast_type: 'string',
    input_type: 'string',
    param: '',
    sort: 0,
    remark: ''
  })

  const rules = computed<FormRules>(() => ({
    name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
    key: [
      { required: true, message: '请输入配置键名', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9_.-]+$/,
        message: '只能由字母、数字、点(.)、短划线(-)和下划线(_)组成',
        trigger: 'blur'
      }
    ],
    value:
      form.input_type === 'int'
        ? [{ pattern: /^-?\d+$/, message: '请输入有效的整数', trigger: 'blur' }]
        : form.input_type === 'float'
          ? [{ pattern: /^-?\d+(\.\d+)?$/, message: '请输入有效的数字', trigger: 'blur' }]
          : form.input_type === 'select' ||
              form.input_type === 'radio' ||
              form.input_type === 'checkbox'
            ? [
                {
                  validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => {
                    if (!value || !form.param) return callback()
                    try {
                      const options = JSON.parse(form.param)
                      const validValues = Array.isArray(options)
                        ? options.map((o: { value: string }) => o.value)
                        : []
                      if (validValues.length && !validValues.includes(value)) {
                        callback(new Error('配置值必须在配置参数的选项中'))
                      } else {
                        callback()
                      }
                    } catch {
                      callback()
                    }
                  },
                  trigger: 'blur'
                }
              ]
            : [],
    cast_type: [{ required: true, message: '请选择值类型', trigger: 'change' }],
    input_type: [{ required: true, message: '请选择输入类型', trigger: 'change' }],
    param: [
      {
        validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => {
          if (!value) return callback()
          try {
            JSON.parse(value)
            callback()
          } catch {
            callback(new Error('配置参数必须是有效的 JSON 格式'))
          }
        },
        trigger: 'blur'
      }
    ]
  }))

  const open = (row?: Api.SystemManage.SettingListItem) => {
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      Object.assign(form, {
        name: row.name,
        key: row.key,
        value: row.value ?? '',
        cast_type: row.cast_type,
        input_type: row.input_type,
        param: row.param ?? '',
        sort: row.sort,
        remark: row.remark ?? ''
      })
    } else {
      id.value = null
      Object.assign(form, {
        name: '',
        key: '',
        value: '',
        cast_type: 'string',
        input_type: 'string',
        param: '',
        sort: 0,
        remark: ''
      })
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const data: Api.SystemManage.SettingSaveParams = {
          name: form.name,
          key: form.key,
          value: form.value || null,
          cast_type: form.cast_type,
          input_type: form.input_type,
          param: form.param || null,
          sort: form.sort,
          remark: form.remark || null
        }
        if (isEdit.value && id.value) {
          await fetchUpdateSetting(id.value, data)
        } else {
          await fetchCreateSetting(data)
        }
        dialogVisible.value = false
        emit('refresh')
      } catch {
        ElMessage.error('操作失败，请重试')
      } finally {
        submitting.value = false
      }
    })
  }

  const handleClose = () => {
    formRef.value?.resetFields()
    dialogVisible.value = false
  }

  defineExpose({ open })
</script>

<style scoped lang="scss"></style>
