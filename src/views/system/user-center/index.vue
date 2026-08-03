<!-- 个人中心页面 -->
<template>
  <div class="w-full h-full p-0 bg-transparent border-none shadow-none">
    <div class="relative flex-b mt-2.5 max-md:block max-md:mt-1">
      <div class="w-112 mr-5 max-md:w-full max-md:mr-0">
        <div class="art-card-sm relative p-9 pb-6 overflow-hidden text-center">
          <img class="absolute top-0 left-0 w-full h-50 object-cover" src="@imgs/user/bg.webp" />
          <img
            class="relative z-10 w-20 h-20 mt-30 mx-auto object-cover border-2 border-white rounded-full"
            src="@imgs/user/avatar.webp"
          />
          <h2 class="mt-5 text-xl font-normal">{{ adminInfo.user_name }}</h2>

          <div class="w-75 mx-auto mt-7.5 text-left">
            <div v-if="adminInfo.email" class="mt-2.5">
              <ArtSvgIcon icon="ri:mail-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ adminInfo.email }}</span>
            </div>
            <div v-if="adminInfo.phone" class="mt-2.5">
              <ArtSvgIcon icon="ri:smartphone-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ adminInfo.phone }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:user-3-line" class="text-g-700" />
              <span class="ml-2 text-sm">管理员</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-hidden max-md:w-full max-md:mt-3.5">
        <div class="art-card-sm">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">基本设置</h1>

          <ElForm
            :model="form"
            class="box-border p-5"
            ref="ruleFormRef"
            :rules="rules"
            label-width="86px"
            label-position="top"
          >
            <ElRow>
              <ElFormItem label="昵称" prop="name">
                <ElInput v-model="form.name" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="邮箱" prop="email" class="ml-5">
                <ElInput v-model="form.email" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="手机号" prop="phone">
                <ElInput v-model="form.phone" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <div class="flex-c justify-end [&_.el-button]:!w-27.5">
              <ElButton type="primary" class="w-22.5" v-ripple :loading="loading" @click="edit">
                {{ isEdit ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>

        <div class="art-card-sm my-5">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">更改密码</h1>

          <ElForm
            :model="pwdForm"
            class="box-border p-5"
            ref="pwdFormRef"
            :rules="pwdRules"
            label-width="86px"
            label-position="top"
          >
            <ElFormItem label="当前密码" prop="old_password">
              <ElInput
                v-model="pwdForm.old_password"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem label="新密码" prop="password">
              <ElInput
                v-model="pwdForm.password"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem label="确认新密码" prop="password_confirmation">
              <ElInput
                v-model="pwdForm.password_confirmation"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <div class="flex-c justify-end [&_.el-button]:!w-27.5">
              <ElButton
                type="primary"
                class="w-22.5"
                v-ripple
                :loading="pwdLoading"
                @click="editPwd"
              >
                {{ isEditPwd ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchChangeAdminPassword,
    fetchGetAdminProfile,
    fetchUpdateAdminProfile
  } from '@/api/system-manage'
  import { useUserStore } from '@/store/modules/user'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'UserCenter' })

  const userStore = useUserStore()
  const adminInfo = computed(() => userStore.getAdminInfo)

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  const loading = ref(false)
  const pwdLoading = ref(false)
  const ruleFormRef = ref<FormInstance>()
  const pwdFormRef = ref<FormInstance>()

  /**
   * 基本信息表单
   */
  const form = reactive({
    name: '',
    email: '',
    phone: ''
  })

  /**
   * 密码修改表单
   */
  const pwdForm = reactive({
    old_password: '',
    password: '',
    password_confirmation: ''
  })

  /**
   * 基本信息验证规则
   */
  const rules = reactive<FormRules>({
    name: [{ max: 50, message: '长度不能超过 50 个字符', trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
    phone: [
      {
        validator: (_rule, value, callback) => {
          if (!value || /^1[2-9]\d{9}$/.test(value)) {
            callback()
          } else {
            callback(new Error('请输入正确的手机号'))
          }
        },
        trigger: 'blur'
      }
    ]
  })

  /**
   * 密码验证规则
   */
  const pwdRules = reactive<FormRules>({
    old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 8, max: 20, message: '长度在 8 到 20 个字符', trigger: 'blur' }
    ],
    password_confirmation: [
      { required: true, message: '请再次输入新密码', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          if (value !== pwdForm.password) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  })

  onMounted(() => {
    loadProfile()
  })

  /**
   * 加载当前管理员资料
   */
  const loadProfile = async () => {
    try {
      const res = await fetchGetAdminProfile()
      form.name = res.name || ''
      form.email = res.email || ''
      form.phone = res.phone || ''
    } catch {
      // 错误已由 request 拦截器统一处理
    }
  }

  /**
   * 切换编辑状态 / 保存资料
   */
  const edit = async () => {
    if (!isEdit.value) {
      isEdit.value = true
      return
    }

    if (!ruleFormRef.value) return
    await ruleFormRef.value.validate(async (valid) => {
      if (!valid) return

      loading.value = true
      try {
        await fetchUpdateAdminProfile({
          name: form.name,
          email: form.email,
          phone: form.phone
        })
        // 更新成功后刷新 user store 中的 adminInfo
        userStore.setAdminInfo({
          ...adminInfo.value,
          user_name: form.name || adminInfo.value.user_name,
          email: form.email || adminInfo.value.email,
          phone: form.phone || adminInfo.value.phone
        } as any)
        isEdit.value = false
      } catch {
        // 错误已由 request 拦截器统一处理
      } finally {
        loading.value = false
      }
    })
  }

  /**
   * 切换密码编辑状态 / 保存密码
   */
  const editPwd = async () => {
    if (!isEditPwd.value) {
      isEditPwd.value = true
      return
    }

    if (!pwdFormRef.value) return
    await pwdFormRef.value.validate(async (valid) => {
      if (!valid) return

      pwdLoading.value = true
      try {
        await fetchChangeAdminPassword(pwdForm.old_password, pwdForm.password)
        // 修改成功后重置表单并退出编辑
        pwdForm.old_password = ''
        pwdForm.password = ''
        pwdForm.password_confirmation = ''
        isEditPwd.value = false
      } catch {
        // 错误已由 request 拦截器统一处理
      } finally {
        pwdLoading.value = false
      }
    })
  }
</script>
