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
        <ElSelect
          v-else-if="form.input_type === 'remote_select'"
          v-model="form.value"
          placeholder="请选择配置值"
          :loading="remoteLoading"
          clearable
          filterable
          style="width: 100%"
        >
          <ElOption
            v-for="opt in remoteOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElRadioGroup v-else-if="form.input_type === 'remote_radio'" v-model="form.value">
          <ElRadio v-for="opt in remoteOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </ElRadio>
        </ElRadioGroup>
        <ElCheckboxGroup v-else-if="form.input_type === 'remote_checkbox'" v-model="multipleValue">
          <ElCheckbox v-for="opt in remoteOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </ElCheckbox>
        </ElCheckboxGroup>
        <div v-else-if="form.input_type === 'image'" class="w-full">
          <ElUpload
            :auto-upload="false"
            accept="image/*"
            :show-file-list="false"
            :disabled="imageUploading"
            @change="handleImageChange"
          >
            <div
              class="flex-c-c w-[100px] h-[100px] rounded-md border-full-d overflow-hidden c-p"
              v-loading="imageUploading"
            >
              <ElImage v-if="form.value" :src="form.value" fit="cover" class="w-full h-full" />
              <ArtSvgIcon v-else icon="ri:image-add-line" class="text-2xl text-g-400" />
            </div>
          </ElUpload>
          <div class="mt-1 flex-c gap-2">
            <ElInput v-model="form.value" placeholder="图片地址（可手动填写）" clearable />
            <ElButton v-if="form.value" link type="danger" @click="form.value = ''">清除</ElButton>
          </div>
        </div>
        <ElInput v-else v-model="form.value" placeholder="请输入配置值" clearable />
        <div v-if="isRemoteType" class="mt-1 text-xs text-g-500">
          <span v-if="remoteError" class="text-danger">{{ remoteError }}</span>
          <span v-else
            >请在下方「配置参数」中填写 {{ '{"url": "/admin/xxx"}' }}，相对地址会自动补全</span
          >
        </div>
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
        <ElSelect
          v-model="form.input_type"
          placeholder="请选择输入类型"
          :loading="inputTypeLoading"
          style="width: 100%"
        >
          <ElOption
            v-for="opt in inputTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="配置参数" prop="param">
        <ElInput v-model="form.param" type="textarea" :rows="2" :placeholder="paramPlaceholder" />
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
  import {
    fetchCreateSetting,
    fetchGetSettingInputTypes,
    fetchUpdateSetting,
    fetchUploadAttachmentFile
  } from '@/api/system-manage'
  import request from '@/utils/http'
  import type { FormInstance, FormRules, UploadFile } from 'element-plus'
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

  /** 远程下拉选项 */
  const remoteOptions = ref<Array<{ label: string; value: string }>>([])
  const remoteLoading = ref(false)
  const remoteError = ref('')

  /** 输入类型选项（由后端 SettingInputType 枚举提供） */
  const inputTypeOptions = ref<Api.SystemManage.SettingInputTypeOption[]>([])
  const inputTypeLoading = ref(false)

  /** 需要远程数据源（配置参数必须包含 url）的输入类型 */
  const REMOTE_INPUT_TYPES = ['remote_select', 'remote_radio', 'remote_checkbox'] as const

  /** 需要本地 options 配置参数的输入类型 */
  const OPTIONS_INPUT_TYPES = ['select', 'radio', 'checkbox'] as const

  const isRemoteType = computed(() =>
    (REMOTE_INPUT_TYPES as readonly string[]).includes(form.input_type)
  )
  const isOptionsType = computed(() =>
    (OPTIONS_INPUT_TYPES as readonly string[]).includes(form.input_type)
  )

  /** 多选类型的配置值以 JSON 数组字符串存储，这里做双向转换 */
  const multipleValue = computed<string[]>({
    get: () => {
      if (!form.value) return []
      try {
        const parsed = JSON.parse(form.value)
        return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
      } catch {
        return form.value ? form.value.split(',').filter(Boolean) : []
      }
    },
    set: (val) => {
      form.value = val.length ? JSON.stringify(val) : ''
    }
  })

  /** 图片上传状态 */
  const imageUploading = ref(false)

  /**
   * 选择图片后中转上传，成功后将可访问地址写入配置值
   */
  const handleImageChange = async (uploadFile: UploadFile) => {
    const file = uploadFile.raw
    if (!file) return

    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }

    imageUploading.value = true
    try {
      const res = await fetchUploadAttachmentFile(file)
      form.value = res.url ?? res.file_path
      ElMessage.success('图片上传成功')
    } catch {
      ElMessage.error('图片上传失败，请重试')
    } finally {
      imageUploading.value = false
    }
  }

  /** 配置参数占位提示（按输入类型给出对应 JSON 示例） */
  const paramPlaceholder = computed(() => {
    switch (form.input_type) {
      case 'remote_select':
      case 'remote_radio':
      case 'remote_checkbox':
        return 'JSON 格式参数（如 {"url": "/admin/settings/input-types"}）'
      case 'select':
      case 'radio':
      case 'checkbox':
        return 'JSON 格式参数（如 [{"label": "启用", "value": "1"}, {"label": "禁用", "value": "0"}]）'
      case 'textarea':
        return 'JSON 格式参数（如 {"maxlength": 200}）'
      case 'image':
        return 'JSON 格式参数（如 {"accept": "image/png,image/jpeg", "max_size": 2048}）'
      case 'int':
      case 'float':
        return 'JSON 格式参数（如 {"min": 0, "max": 100}）'
      default:
        return 'JSON 格式参数（选填）'
    }
  })

  /**
   * 加载后端提供的输入类型枚举选项，失败时保持为空并提示
   */
  const loadInputTypes = async () => {
    if (inputTypeOptions.value.length || inputTypeLoading.value) return
    inputTypeLoading.value = true
    try {
      const res = await fetchGetSettingInputTypes()
      inputTypeOptions.value = res.data ?? []
    } catch {
      ElMessage.error('输入类型加载失败，请重试')
    } finally {
      inputTypeLoading.value = false
    }
  }

  /**
   * 归一化远程返回的数据为下拉选项
   *
   * 兼容以下结构：
   * - `[{ label, value }]`
   * - `{ data: [...] }` / `{ options: [...] }`
   * - `{ key: label }` 键值对
   *
   * @return {Array<{label: string, value: string}>}
   */
  const normalizeRemoteOptions = (raw: unknown): Array<{ label: string; value: string }> => {
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as Record<string, unknown>)?.data)
        ? ((raw as Record<string, unknown>).data as unknown[])
        : Array.isArray((raw as Record<string, unknown>)?.options)
          ? ((raw as Record<string, unknown>).options as unknown[])
          : null

    if (list) {
      return list.map((item) => {
        if (item !== null && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          const value = String(obj.value ?? obj.key ?? obj.id ?? '')
          return { label: String(obj.label ?? obj.name ?? obj.title ?? value), value }
        }
        return { label: String(item), value: String(item) }
      })
    }

    if (raw !== null && typeof raw === 'object') {
      return Object.entries(raw as Record<string, unknown>).map(([value, label]) => ({
        value,
        label: String(label)
      }))
    }

    return []
  }

  /**
   * 从 param 中的 url 加载远程下拉选项，相对地址使用请求 baseURL 补全
   */
  const loadRemoteOptions = async () => {
    remoteOptions.value = []
    remoteError.value = ''

    let url = ''
    try {
      const param = form.param ? JSON.parse(form.param) : null
      url = String(param?.url ?? '')
    } catch {
      remoteError.value = '配置参数必须是有效的 JSON 格式'
      return
    }

    if (!url) {
      remoteError.value = '请在配置参数中填写 url，例如 {"url": "/admin/settings/options"}'
      return
    }

    remoteLoading.value = true
    try {
      const isAbsolute = /^https?:\/\//i.test(url)
      const res = await request.get<unknown>({
        url,
        baseURL: isAbsolute ? '' : import.meta.env.VITE_API_URL,
        showErrorMessage: false
      })
      remoteOptions.value = normalizeRemoteOptions(res)
      if (!remoteOptions.value.length) {
        remoteError.value = '远程地址未返回可用选项'
      }
    } catch {
      remoteError.value = '远程选项加载失败，请检查 url 是否正确'
    } finally {
      remoteLoading.value = false
    }
  }

  const debouncedLoadRemoteOptions = useDebounceFn(loadRemoteOptions, 300)

  watch(
    () => [form.input_type, form.param, dialogVisible.value] as const,
    ([, , visible]) => {
      if (visible && isRemoteType.value) {
        debouncedLoadRemoteOptions()
      }
    },
    { immediate: true }
  )

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
          : isOptionsType.value
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
          const isRemote = isRemoteType.value
          if (!value) {
            return callback(isRemote ? new Error('远程数据源必须填写 url 参数') : undefined)
          }
          try {
            const parsed = JSON.parse(value)
            if (isRemote && !parsed?.url) {
              return callback(new Error('远程数据源的配置参数必须包含 url 字段'))
            }
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
    loadInputTypes()
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
    remoteOptions.value = []
    remoteError.value = ''
    dialogVisible.value = false
  }

  defineExpose({ open })
</script>

<style scoped lang="scss"></style>
