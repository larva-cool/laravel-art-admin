<template>
  <div class="art-full-height p-4" v-loading="loading">
    <template v-if="groups.length > 0">
      <!-- 分组标签页 -->
      <div class="art-card p-5">
        <div class="art-card-header mb-4">
          <div class="title">
            <h4>系统配置</h4>
            <p>分组管理应用配置项</p>
          </div>
        </div>

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
              label-position="top"
              class="mt-2"
              @submit.prevent
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <ElFormItem v-for="item in group.items" :key="item.key" :label="item.name">
                  <!-- text / string 输入 -->
                  <ElInput
                    v-if="item.input_type === 'text' || item.input_type === 'string'"
                    v-model="formData[item.key]"
                    :placeholder="
                      t('menus.system.configPage.inputPlaceholder', { name: item.name })
                    "
                    clearable
                  />
                  <!-- textarea 多行文本 -->
                  <ElInput
                    v-else-if="item.input_type === 'textarea'"
                    v-model="formData[item.key]"
                    type="textarea"
                    :rows="3"
                    :placeholder="
                      t('menus.system.configPage.inputPlaceholder', { name: item.name })
                    "
                  />
                  <!-- int 数字输入 -->
                  <ElInputNumber
                    v-else-if="item.input_type === 'int'"
                    v-model="formData[item.key]"
                    :min="0"
                    controls-position="right"
                    class="w-full"
                  />
                  <!-- float 数字输入 -->
                  <ElInputNumber
                    v-else-if="item.input_type === 'float'"
                    v-model="formData[item.key]"
                    :min="0"
                    :precision="2"
                    controls-position="right"
                    class="w-full"
                  />
                  <!-- bool 开关 -->
                  <div v-else-if="item.input_type === 'bool'" class="flex-c gap-2">
                    <ElSwitch v-model="formData[item.key]" :active-value="1" :inactive-value="0" />
                    <span class="text-xs text-g-500">
                      {{ formData[item.key] === 1 ? '已开启' : '已关闭' }}
                    </span>
                  </div>
                  <!-- select 下拉选择 -->
                  <ElSelect
                    v-else-if="item.input_type === 'select'"
                    v-model="formData[item.key]"
                    :placeholder="
                      t('menus.system.configPage.selectPlaceholder', { name: item.name })
                    "
                    clearable
                    class="w-full"
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
                      :value="opt.value"
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
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </ElCheckbox>
                  </ElCheckboxGroup>
                  <!-- 默认降级为 input -->
                  <ElInput v-else v-model="formData[item.key]" clearable />

                  <!-- 备注提示 -->
                  <div v-if="item.remark" class="text-xs text-g-500 mt-1 leading-tight">
                    {{ item.remark }}
                  </div>
                </ElFormItem>
              </div>
            </ElForm>
          </ElTabPane>
        </ElTabs>

        <!-- 操作按钮 -->
        <div class="flex-c gap-3 mt-4 pt-4 border-t-d">
          <ElButton type="primary" :loading="submitting" @click="handleSubmit" v-ripple>
            {{ $t('table.form.submit') }}
          </ElButton>
          <ElButton @click="handleReset">{{ $t('table.form.reset') }}</ElButton>
        </div>
      </div>
    </template>

    <ElEmpty v-else :description="$t('menus.system.configPage.empty')" />
  </div>
</template>

<script setup lang="ts">
  import { fetchBatchUpdateSettings, fetchGetSettingGroups } from '@/api/system-manage'
  import { ElMessage } from 'element-plus'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'SystemConfig' })

  const { t } = useI18n()

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
      originalData.value = JSON.parse(JSON.stringify(formData))
    } finally {
      submitting.value = false
    }
  }

  /** 重置当前表单到初始值 */
  const handleReset = () => {
    Object.keys(formData).forEach((k) => delete formData[k])
    Object.assign(formData, JSON.parse(JSON.stringify(originalData.value)))
    ElMessage.success(t('menus.system.configPage.resetSuccess'))
  }

  onMounted(() => {
    loadData()
  })
</script>

<style scoped lang="scss">
  .config-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
    }

    :deep(.el-tabs__item) {
      height: 44px;
      padding: 0 16px;
      font-size: 14px;
      line-height: 44px;

      &.is-active {
        font-weight: 600;
        color: var(--el-color-primary);
      }
    }

    :deep(.el-tabs__active-bar) {
      height: 2px;
      border-radius: 2px;
    }
  }
</style>
