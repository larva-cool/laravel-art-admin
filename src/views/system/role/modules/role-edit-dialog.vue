<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="450px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="角色Code" prop="name">
        <ElInput v-model="form.name" placeholder="请输入角色Code（英文标识）" clearable />
      </ElFormItem>
      <ElFormItem label="角色名称" prop="display_name">
        <ElInput v-model="form.display_name" placeholder="请输入角色名称" clearable />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateRole, fetchUpdateRole } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'RoleEditDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑角色' : '新增角色'))

  const form = reactive<{ name: string; display_name: string }>({
    name: '',
    display_name: ''
  })

  const rules: FormRules = {
    name: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    display_name: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ]
  }

  const open = (row?: Api.SystemManage.RoleListItem) => {
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      form.name = row.name
      form.display_name = row.display_name
    } else {
      id.value = null
      form.name = ''
      form.display_name = ''
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        if (isEdit.value && id.value) {
          await fetchUpdateRole(id.value, { name: form.name, display_name: form.display_name })
        } else {
          await fetchCreateRole({ name: form.name, display_name: form.display_name })
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
