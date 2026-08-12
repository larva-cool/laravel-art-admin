<template>
  <div class="art-full-height p-4">
    <ElCard v-loading="loading" class="config-card" shadow="never">
      <template v-if="groups.length > 0">
        <!-- 标签页 -->
        <ElTabs v-model="activeTab" class="config-tabs">
          <ElTabPane
            v-for="group in groups"
            :key="group.key"
            :name="group.key"
            :label="group.title"
          >
            <ElForm
              ref="formRef"
              :model="formData"
              label-width="180px"
              label-position="right"
              class="config-form mt-4"
              @submit.prevent
            >
              <template v-for="item in group.items" :key="item.key">
                <ElFormItem :label="item.name">
                  <!-- text / string 输入 -->
                  <ElInput
                    v-if="item.input_type === 'text' || item.input_type === 'string'"
                    v-model="formData[item.key]"
                    :placeholder="'请输入' + item.name"
                    clearable
                    class="max-w-xl"
                  />
                  <!-- textarea 多行文本 -->
                  <ElInput
                    v-else-if="item.input_type === 'textarea'"
                    v-model="formData[item.key]"
                    type="textarea"
                    :rows="4"
                    :placeholder="'请输入' + item.name"
                    class="max-w-xl"
                  />
                  <!-- int 数字输入 -->
                  <ElInputNumber
                    v-else-if="item.input_type === 'int'"
                    v-model="formData[item.key]"
                    :min="0"
                    controls-position="right"
                    class="max-w-xs"
                  />
                  <!-- bool 开关 -->
                  <ElSwitch
                    v-else-if="item.input_type === 'bool'"
                    v-model="formData[item.key]"
                    :active-value="1"
                    :inactive-value="0"
                  />
                  <!-- select 下拉选择 -->
                  <ElSelect
                    v-else-if="item.input_type === 'select'"
                    v-model="formData[item.key]"
                    :placeholder="'请选择' + item.name"
                    clearable
                    class="max-w-xs"
                  >
                    <ElOption
                      v-for="opt in parseOptions(item.param)"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </ElSelect>
                  <!-- radio 单选 -->
                  <ElRadioGroup
                    v-else-if="item.input_type === 'radio'"
                    v-model="formData[item.key]"
                  >
                    <ElRadio
                      v-for="opt in parseOptions(item.param)"
                      :key="opt.value"
                      :label="opt.value"
                    >
                      {{ opt.label }}
                    </ElRadio>
                  </ElRadioGroup>
                  <!-- checkbox 多选 -->
                  <ElCheckboxGroup
                    v-else-if="item.input_type === 'checkbox'"
                    v-model="formData[item.key]"
                  >
                    <ElCheckbox
                      v-for="opt in parseOptions(item.param)"
                      :key="opt.value"
                      :label="opt.value"
                    >
                      {{ opt.label }}
                    </ElCheckbox>
                  </ElCheckboxGroup>
                  <!-- 默认降级为 input -->
                  <ElInput v-else v-model="formData[item.key]" clearable class="max-w-xl" />
                  <!-- 备注提示 -->
                  <span v-if="item.remark" class="config-remark ml-3">{{ item.remark }}</span>
                </ElFormItem>
              </template>
            </ElForm>
          </ElTabPane>
        </ElTabs>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-start gap-3 mt-6 pl-[180px]">
          <ElButton type="primary" :loading="submitting" @click="handleSubmit" v-ripple
            >提交</ElButton
          >
          <ElButton @click="handleReset">重置</ElButton>
        </div>
      </template>

      <ElEmpty v-else description="暂无配置项" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { fetchBatchUpdateSettings, fetchGetSettingGroups } from '@/api/system-manage'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'SystemConfig' })

  type SettingGroup = Api.SystemManage.SettingGroup
  type SettingGroupItem = Api.SystemManage.SettingGroupItem

  const loading = ref(false)
  const submitting = ref(false)
  const groups = ref<SettingGroup[]>([])
  const activeTab = ref('')
  const formData = reactive<Record<string, any>>({})
  const originalData = ref<Record<string, any>>({})

  /** 解析 param 中的选项数据（支持 options 数组或键值对） */
  const parseOptions = (param: Record<string, any> | null) => {
    if (!param) return []
    if (Array.isArray(param.options)) return param.options
    if (Array.isArray(param)) return param
    return Object.entries(param).map(([value, label]) => ({ value, label: String(label) }))
  }

  /** 根据 cast_type 转换初始值类型 */
  const castValue = (item: SettingGroupItem): any => {
    const v = item.value
    switch (item.cast_type) {
      case 'int':
      case 'integer':
        return v === null || v === '' ? 0 : Number(v)
      case 'float':
        return v === null || v === '' ? 0 : Number(v)
      case 'bool':
      case 'boolean':
        return v ? 1 : 0
      default:
        return v ?? ''
    }
  }

  /** 加载配置数据 */
  const loadData = async () => {
    loading.value = true
    try {
      const res = await fetchGetSettingGroups()
      groups.value = res.groups
      if (groups.value.length > 0) {
        activeTab.value = groups.value[0].key
      }
      // 将所有配置项展平到 formData，做类型转换
      const data: Record<string, any> = {}
      groups.value.forEach((g) => {
        g.items.forEach((item) => {
          data[item.key] = castValue(item)
        })
      })
      Object.keys(formData).forEach((k) => delete formData[k])
      Object.assign(formData, data)
      originalData.value = JSON.parse(JSON.stringify(data))
    } finally {
      loading.value = false
    }
  }

  /** 提交保存 */
  const handleSubmit = async () => {
    submitting.value = true
    try {
      await fetchBatchUpdateSettings({ ...formData })
      // 保存成功后刷新基准数据
      originalData.value = JSON.parse(JSON.stringify(formData))
    } finally {
      submitting.value = false
    }
  }

  /** 重置当前表单到初始值 */
  const handleReset = () => {
    Object.keys(formData).forEach((k) => delete formData[k])
    Object.assign(formData, JSON.parse(JSON.stringify(originalData.value)))
    ElMessage.success('已重置')
  }

  onMounted(() => {
    loadData()
  })
</script>

<style scoped lang="scss">
  .config-card {
    border-radius: 8px;

    :deep(.el-card__body) {
      padding: 0 24px 24px;
    }
  }

  .config-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 2px;
    }

    :deep(.el-tabs__item) {
      height: 50px;
      padding: 0 20px;
      font-size: 15px;
      line-height: 50px;

      &.is-active {
        font-weight: 600;
        color: var(--el-color-primary);
      }
    }

    :deep(.el-tabs__active-bar) {
      height: 3px;
      border-radius: 2px;
    }
  }

  .config-form {
    :deep(.el-form-item) {
      margin-bottom: 18px;
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: var(--el-text-color-regular);
    }
  }

  .config-remark {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
</style>
