<template>
  <div class="art-full-height p-4" v-loading="loading">
    <template v-if="groups.length > 0">
      <div class="flex flex-col md:flex-row items-start gap-4 flex-1 min-h-0">
        <!-- 左侧：分组导航 -->
        <div class="w-full md:w-56 shrink-0">
          <div class="art-card p-4">
            <div class="text-xs uppercase font-bold text-g-500 mb-2">
              {{ t('menus.system.configPage.groupNav') }}
            </div>
            <div class="space-y-0.5">
              <div
                v-for="group in groups"
                :key="group.key"
                class="flex-c gap-2 px-2.5 py-2 rounded-md c-p tad-200"
                :class="
                  activeGroup === group.key
                    ? 'bg-theme/10 text-theme font-medium'
                    : 'text-g-700 hover:bg-hover-color'
                "
                @click="scrollToGroup(group.key)"
              >
                <ArtSvgIcon :icon="groupIcon(group.key)" class="text-base shrink-0" />
                <span class="text-sm truncate">{{ group.title }}</span>
              </div>
            </div>

            <!-- 发布影响提示 -->
            <div class="mt-3 pt-3 border-t-d">
              <p class="text-xs font-medium text-theme">
                {{ t('menus.system.configPage.impactTitle') }}
              </p>
              <p class="mt-1 text-xs leading-relaxed text-g-500">
                {{ t('menus.system.configPage.impactTip') }}
              </p>
            </div>
          </div>
        </div>

        <!-- 右侧：分组表单 -->
        <div
          ref="contentRef"
          class="relative flex-1 min-w-0 w-full md:h-full md:overflow-y-auto"
          @scroll="syncActiveGroup"
        >
          <ElForm :model="formData" label-position="top" @submit.prevent>
            <div
              v-for="group in groups"
              :key="group.key"
              :ref="setSectionRef(group.key)"
              class="art-card p-5 mb-4 last:mb-0"
            >
              <div class="art-card-header">
                <div class="title">
                  <h4>{{ group.title }}</h4>
                  <p>
                    {{ t('menus.system.configPage.groupItemCount', { count: group.items.length }) }}
                  </p>
                </div>
                <ArtSvgIcon :icon="groupIcon(group.key)" class="text-lg text-g-400" />
              </div>

              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <template v-for="item in group.items" :key="item.key">
                  <!-- bool 开关：整行卡片式 -->
                  <div v-if="item.input_type === 'bool'" class="md:col-span-2 mb-3">
                    <div class="flex-cb gap-4 px-4 py-3 rounded-md border-full-d">
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-g-900">{{ item.name }}</p>
                        <p v-if="item.remark" class="mt-0.5 text-xs leading-tight text-g-500">
                          {{ item.remark }}
                        </p>
                      </div>
                      <ElSwitch
                        v-model="formData[item.key]"
                        :active-value="1"
                        :inactive-value="0"
                      />
                    </div>
                  </div>

                  <!-- 其他输入类型 -->
                  <ElFormItem
                    v-else
                    :label="item.name"
                    :class="item.input_type === 'textarea' ? 'md:col-span-2' : ''"
                  >
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
                      :maxlength="item.param?.maxlength"
                      :show-word-limit="!!item.param?.maxlength"
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
                </template>
              </div>
            </div>
          </ElForm>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="art-card mt-4 px-5 py-3 flex-cb flex-wrap gap-3 shrink-0">
        <div class="min-w-0">
          <p class="text-sm font-medium text-g-900">{{ systemName }}</p>
          <p class="mt-0.5 text-xs text-g-500">{{ t('menus.system.configPage.saveTip') }}</p>
        </div>
        <div class="flex-c gap-3">
          <ElButton @click="handleReset">
            {{ t('menus.system.configPage.resetForm') }}
          </ElButton>
          <ElButton type="primary" :loading="submitting" @click="handleSubmit" v-ripple>
            {{ t('menus.system.configPage.savePublish') }}
          </ElButton>
        </div>
      </div>
    </template>

    <ElEmpty v-else :description="$t('menus.system.configPage.empty')" />
  </div>
</template>

<script setup lang="ts">
  import { fetchBatchUpdateSettings, fetchGetSettingGroups } from '@/api/system-manage'
  import AppConfig from '@/config'
  import { ElMessage } from 'element-plus'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'SystemConfig' })

  const { t } = useI18n()

  type SettingGroup = Api.SystemManage.SettingGroup
  type SettingGroupItem = Api.SystemManage.SettingGroupItem

  const systemName = AppConfig.systemInfo.name

  const loading = ref(false)
  const submitting = ref(false)
  const groups = ref<SettingGroup[]>([])
  const activeGroup = ref('')
  const formData = reactive<Record<string, any>>({})
  const originalData = ref<Record<string, any>>({})

  const contentRef = ref<HTMLElement>()
  const sectionRefs: Record<string, HTMLElement> = {}

  /** 分组图标映射 */
  const groupIcons: Record<string, string> = {
    system: 'ri:global-line',
    sms_captcha: 'ri:message-2-line',
    email_captcha: 'ri:mail-line',
    user: 'ri:user-3-line',
    upload: 'ri:upload-cloud-2-line',
    openai: 'ri:robot-2-line',
    broadcast: 'ri:live-line'
  }

  /** 获取分组图标（未配置时降级为通用设置图标） */
  const groupIcon = (key: string): string => groupIcons[key] ?? 'ri:settings-3-line'

  /** 收集分组卡片 DOM，用于导航定位 */
  const setSectionRef = (key: string) => (el: unknown) => {
    if (el) {
      sectionRefs[key] = (el as { $el?: HTMLElement }).$el ?? (el as HTMLElement)
    }
  }

  /** 点击左侧导航滚动到对应分组 */
  const scrollToGroup = (key: string) => {
    activeGroup.value = key
    const el = sectionRefs[key]
    const container = contentRef.value
    if (!el) {
      return
    }
    if (container && container.scrollHeight > container.clientHeight) {
      container.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  /** 根据滚动位置同步左侧导航高亮 */
  const syncActiveGroup = () => {
    const container = contentRef.value
    if (!container) {
      return
    }
    const threshold = container.scrollTop + 16
    let current = groups.value[0]?.key ?? ''
    groups.value.forEach((group) => {
      const el = sectionRefs[group.key]
      if (el && el.offsetTop <= threshold) {
        current = group.key
      }
    })
    activeGroup.value = current
  }

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
        activeGroup.value = groups.value[0].key
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
