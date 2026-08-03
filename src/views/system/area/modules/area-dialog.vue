<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="父级地区" prop="parent_id">
        <ElTreeSelect
          v-model="form.parent_id"
          :data="areaTreeData"
          :props="{ label: 'name', value: 'id', children: 'children' }"
          check-strictly
          clearable
          placeholder="不选则为顶级地区"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="地区名称" prop="name">
        <ElInput v-model="form.name" placeholder="请输入地区名称" clearable />
      </ElFormItem>
      <ElFormItem label="区域编码" prop="area_code">
        <ElInputNumber
          v-model="form.area_code"
          :controls="false"
          placeholder="请输入区域编码"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="区号" prop="city_code">
        <ElInput v-model="form.city_code" placeholder="请输入区号（如 010）" clearable />
      </ElFormItem>
      <ElFormItem label="纬度" prop="lat">
        <ElInputNumber
          v-model="form.lat"
          :controls="false"
          :precision="6"
          :step="0.000001"
          placeholder="请输入纬度"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="经度" prop="lng">
        <ElInputNumber
          v-model="form.lng"
          :controls="false"
          :precision="6"
          :step="0.000001"
          placeholder="请输入经度"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="排序" prop="sort">
        <ElInputNumber v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateArea, fetchUpdateArea } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'AreaDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑地区' : '新增地区'))

  /** 父级地区树数据（包含"顶级"选项） */
  const areaTreeData = ref<Api.SystemManage.AreaListItem[]>([])

  const form = reactive({
    parent_id: null as number | null,
    name: '',
    area_code: null as number | null,
    city_code: '',
    lat: null as number | null,
    lng: null as number | null,
    sort: 0
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入地区名称', trigger: 'blur' }]
  }

  const open = (
    row: Api.SystemManage.AreaListItem | null,
    treeData: Api.SystemManage.AreaListItem[],
    parentId?: number | null
  ) => {
    dialogVisible.value = true
    areaTreeData.value = treeData

    if (row) {
      id.value = row.id
      Object.assign(form, {
        parent_id: row.parent_id,
        name: row.name,
        area_code: row.area_code,
        city_code: row.city_code ?? '',
        lat: row.lat,
        lng: row.lng,
        sort: row.sort
      })
    } else {
      id.value = null
      Object.assign(form, {
        parent_id: parentId ?? null,
        name: '',
        area_code: null,
        city_code: '',
        lat: null,
        lng: null,
        sort: 0
      })
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const data: Api.SystemManage.AreaSaveParams = {
          parent_id: form.parent_id,
          name: form.name,
          area_code: form.area_code,
          city_code: form.city_code || null,
          lat: form.lat,
          lng: form.lng,
          sort: form.sort
        }
        if (isEdit.value && id.value) {
          await fetchUpdateArea(id.value, data)
        } else {
          await fetchCreateArea(data)
        }
        dialogVisible.value = false
        emit('refresh')
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
