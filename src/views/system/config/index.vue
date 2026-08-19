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
                      class="!w-full"
                    />
                    <!-- float 数字输入 -->
                    <ElInputNumber
                      v-else-if="item.input_type === 'float'"
                      v-model="formData[item.key]"
                      :min="0"
                      :precision="2"
                      controls-position="right"
                      class="!w-full"
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
                      :model-value="getMultipleValue(item.key)"
                      @update:model-value="(val) => setMultipleValue(item.key, val as string[])"
                    >
                      <ElCheckbox
                        v-for="opt in parseOptions(item.param)"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </ElCheckbox>
                    </ElCheckboxGroup>
                    <!-- remote_select 远程下拉选择 -->
                    <ElSelect
                      v-else-if="item.input_type === 'remote_select'"
                      v-model="formData[item.key]"
                      :placeholder="
                        t('menus.system.configPage.selectPlaceholder', { name: item.name })
                      "
                      :loading="remoteLoading[item.key]"
                      clearable
                      filterable
                      class="w-full"
                    >
                      <ElOption
                        v-for="opt in remoteOptions[item.key] ?? []"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </ElSelect>
                    <!-- remote_radio 远程单选 -->
                    <ElRadioGroup
                      v-else-if="item.input_type === 'remote_radio'"
                      v-model="formData[item.key]"
                      :disabled="remoteLoading[item.key]"
                    >
                      <ElRadio
                        v-for="opt in remoteOptions[item.key] ?? []"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </ElRadio>
                    </ElRadioGroup>
                    <!-- remote_checkbox 远程多选 -->
                    <ElCheckboxGroup
                      v-else-if="item.input_type === 'remote_checkbox'"
                      :model-value="getMultipleValue(item.key)"
                      :disabled="remoteLoading[item.key]"
                      @update:model-value="(val) => setMultipleValue(item.key, val as string[])"
                    >
                      <ElCheckbox
                        v-for="opt in remoteOptions[item.key] ?? []"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </ElCheckbox>
                    </ElCheckboxGroup>
                    <!-- image 图片上传 -->
                    <div v-else-if="item.input_type === 'image'" class="w-full">
                      <ElUpload
                        :auto-upload="false"
                        accept="image/*"
                        :show-file-list="false"
                        :disabled="uploadingKey === item.key"
                        @change="(file: UploadFile) => handleImageChange(item.key, file)"
                      >
                        <div
                          class="flex-c-c w-[100px] h-[100px] rounded-md border-full-d overflow-hidden c-p"
                          v-loading="uploadingKey === item.key"
                        >
                          <ElImage
                            v-if="formData[item.key]"
                            :src="formData[item.key]"
                            fit="cover"
                            class="w-full h-full"
                          />
                          <ArtSvgIcon v-else icon="ri:image-add-line" class="text-2xl text-g-400" />
                        </div>
                      </ElUpload>
                      <div class="mt-1 flex-c gap-2">
                        <ElInput
                          v-model="formData[item.key]"
                          placeholder="图片地址（可手动填写）"
                          clearable
                        />
                      </div>
                    </div>
                    <!-- 默认降级为 input -->
                    <ElInput v-else v-model="formData[item.key]" clearable />

                    <!-- 备注提示 -->
                    <div v-if="item.remark" class="w-full text-xs text-g-500 mt-1 leading-tight">
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
  import {
    fetchBatchUpdateSettings,
    fetchGetSettingGroups,
    fetchUploadAttachmentFile
  } from '@/api/system-manage'
  import AppConfig from '@/config'
  import request from '@/utils/http'
  import type { UploadFile } from 'element-plus'
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

  /** 多选类型的值以 JSON 数组字符串存储，读取时转为数组 */
  const getMultipleValue = (key: string): string[] => {
    const raw = formData[key]
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item))
    }
    if (!raw) {
      return []
    }
    try {
      const parsed = JSON.parse(String(raw))
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
    } catch {
      return String(raw).split(',').filter(Boolean)
    }
  }

  /** 多选类型写回时序列化为 JSON 数组字符串 */
  const setMultipleValue = (key: string, val: string[]) => {
    formData[key] = val.length ? JSON.stringify(val) : ''
  }

  /** 远程数据源的输入类型 */
  const REMOTE_INPUT_TYPES = ['remote_select', 'remote_radio', 'remote_checkbox']

  /** 各配置项的远程选项与加载状态（以配置 key 索引） */
  const remoteOptions = reactive<Record<string, Array<{ label: string; value: string }>>>({})
  const remoteLoading = reactive<Record<string, boolean>>({})

  /**
   * 归一化远程返回的数据为下拉选项
   *
   * 兼容 `[{ label, value }]`、`{ data: [...] }`、`{ options: [...] }` 及键值对结构
   */
  const normalizeRemoteOptions = (raw: unknown): Array<{ label: string; value: string }> => {
    const source = raw as Record<string, unknown> | null
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(source?.data)
        ? (source.data as unknown[])
        : Array.isArray(source?.options)
          ? (source.options as unknown[])
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
   * 加载单个远程类型配置项的选项数据，url 取自 param.url
   */
  const loadRemoteOptions = async (item: SettingGroupItem) => {
    const url = String(item.param?.url ?? '')
    if (!url) {
      remoteOptions[item.key] = []
      return
    }

    remoteLoading[item.key] = true
    try {
      const isAbsolute = /^https?:\/\//i.test(url)
      const res = await request.get<unknown>({
        url,
        baseURL: isAbsolute ? '' : import.meta.env.VITE_API_URL,
        showErrorMessage: false
      })
      remoteOptions[item.key] = normalizeRemoteOptions(res)
    } catch {
      remoteOptions[item.key] = []
    } finally {
      remoteLoading[item.key] = false
    }
  }

  /** 并发加载所有远程类型配置项的选项 */
  const loadAllRemoteOptions = async () => {
    const items = groups.value.flatMap((group) =>
      group.items.filter((item) => REMOTE_INPUT_TYPES.includes(item.input_type))
    )
    await Promise.all(items.map((item) => loadRemoteOptions(item)))
  }

  /** 正在上传图片的配置项 key */
  const uploadingKey = ref('')

  /** 选择图片后上传，并把返回地址写入对应配置项 */
  const handleImageChange = async (key: string, uploadFile: UploadFile) => {
    const file = uploadFile.raw
    if (!file) {
      return
    }
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }
    uploadingKey.value = key
    try {
      const res = await fetchUploadAttachmentFile(file)
      formData[key] = res.url ?? res.file_path
      ElMessage.success('图片上传成功')
    } catch {
      ElMessage.error('图片上传失败，请重试')
    } finally {
      uploadingKey.value = ''
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
      loadAllRemoteOptions()
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
