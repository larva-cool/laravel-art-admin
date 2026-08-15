<template>
  <ElDialog
    v-model="dialogVisible"
    title="延长VIP"
    width="420px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElAlert
      :title="vipExpiresAt ? `当前到期时间: ${vipExpiresAt}` : '当前非VIP用户'"
      type="info"
      :closable="false"
      class="mb-4"
    />
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="用户名">
        <ElInput :value="username" disabled />
      </ElFormItem>
      <ElFormItem label="延长天数" prop="days">
        <ElInputNumber
          v-model="form.days"
          :min="1"
          :max="3650"
          :step="30"
          placeholder="请输入延长天数"
          style="width: 100%"
        />
        <div class="form-tip"
          >输入延长的天数（1~3650天），当前为VIP则从到期日续期，否则从今日开始计算</div
        >
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认延长</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchExtendUserVip } from '@/api/user-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'UserExtendVipDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const username = ref('')
  const vipExpiresAt = ref<string | null>(null)

  const form = reactive({
    days: 30
  })

  const rules = computed<FormRules>(() => ({
    days: [
      { required: true, message: '请输入延长天数', trigger: 'blur' },
      { type: 'number', min: 1, message: '天数需大于 0', trigger: 'blur' }
    ]
  }))

  const open = (row: Api.UserManage.UserListItem) => {
    dialogVisible.value = true
    id.value = row.id
    username.value = row.username
    vipExpiresAt.value = row.vip_expires_at
    form.days = 30
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        await fetchExtendUserVip(id.value!, { days: form.days })
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

<style scoped lang="scss">
  .mb-4 {
    margin-bottom: 12px;
  }

  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
  }
</style>
