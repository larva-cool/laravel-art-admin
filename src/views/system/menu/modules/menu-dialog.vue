<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElRow :gutter="20">
        <ElCol :span="24">
          <ElFormItem label="菜单类型" prop="type">
            <ElRadioGroup v-model="form.type">
              <ElRadioButton :value="0">目录</ElRadioButton>
              <ElRadioButton :value="1">菜单</ElRadioButton>
              <ElRadioButton :value="2">按钮</ElRadioButton>
              <ElRadioButton :value="3">内嵌</ElRadioButton>
              <ElRadioButton :value="4">外链</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="父级菜单" prop="parent_id">
            <ElTreeSelect
              v-model="form.parent_id"
              :data="menuTreeData"
              :props="{ label: 'title', value: 'id', children: 'children' }"
              check-strictly
              clearable
              placeholder="不选则为顶级菜单"
              style="width: 100%"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="菜单名称" prop="title">
            <ElInput v-model="form.title" placeholder="请输入菜单名称" clearable />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow v-if="form.type !== 2" :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="路由路径" prop="path">
            <ElInput v-model="form.path" placeholder="如：/dashboard 或 console" clearable />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="路由名称" prop="name">
            <ElInput v-model="form.name" placeholder="如：dashboard" clearable />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow v-if="form.type !== 2 && form.type !== 4" :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="组件路径" prop="component">
            <ElInput v-model="form.component" placeholder="如：/system/user 或留空" clearable />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="重定向" prop="redirect">
            <ElInput v-model="form.redirect" placeholder="如：/system/user/list" clearable />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="图标" prop="icon">
            <ElInput v-model="form.icon" placeholder="如：ri:user-line" clearable />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="form.type === 4 || form.type === 3" :span="12">
          <ElFormItem label="外部链接" prop="link">
            <ElInput v-model="form.link" placeholder="如：https://www.example.com" clearable />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="权限标识" prop="permission">
            <ElInput
              v-model="form.permission"
              placeholder="如：system.admin 或 users.create"
              clearable
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="排序" prop="sort">
            <ElInputNumber
              v-model="form.sort"
              :min="0"
              controls-position="right"
              style="width: 100%"
            />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="form.type !== 2" :span="12">
          <ElFormItem label="文本徽章" prop="show_text_badge">
            <ElInput v-model="form.show_text_badge" placeholder="如：New、Hot" clearable />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow v-if="form.type !== 2 && form.type !== 4" :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="激活路径" prop="active_path">
            <ElInput v-model="form.active_path" placeholder="如：/system/admin" clearable />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="6">
          <ElFormItem label="是否启用" prop="is_enable">
            <ElSwitch v-model="form.is_enable" />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="form.type !== 2" :span="6">
          <ElFormItem label="隐藏菜单" prop="is_hide">
            <ElSwitch v-model="form.is_hide" />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="form.type !== 2" :span="6">
          <ElFormItem label="标签隐藏" prop="is_hide_tab">
            <ElSwitch v-model="form.is_hide_tab" />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="form.type !== 2" :span="6">
          <ElFormItem label="页面缓存" prop="keep_alive">
            <ElSwitch v-model="form.keep_alive" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow v-if="form.type !== 2" :gutter="20">
        <ElCol :span="6">
          <ElFormItem label="全屏页面" prop="is_full_page">
            <ElSwitch v-model="form.is_full_page" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="固定标签" prop="fixed_tab">
            <ElSwitch v-model="form.fixed_tab" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="显示徽章" prop="show_badge">
            <ElSwitch v-model="form.show_badge" />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="form.type === 3" :span="6">
          <ElFormItem label="是否内嵌" prop="is_iframe">
            <ElSwitch v-model="form.is_iframe" />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateMenu, fetchUpdateMenu } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'MenuDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  type MenuTreeItem = Api.SystemManage.MenuTreeItem
  type MenuTypeValue = Api.SystemManage.MenuTypeValue

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑菜单' : '新增菜单'))

  /** 父级菜单树数据 */
  const menuTreeData = ref<MenuTreeItem[]>([])

  const form = reactive({
    parent_id: 0 as number,
    path: '' as string | null,
    name: '' as string | null,
    component: '' as string | null,
    redirect: '' as string | null,
    title: '',
    icon: '' as string | null,
    link: '' as string | null,
    type: 1 as MenuTypeValue,
    sort: 0,
    is_enable: true,
    is_hide: false,
    is_hide_tab: false,
    is_iframe: false,
    keep_alive: false,
    is_full_page: false,
    fixed_tab: false,
    show_badge: false,
    show_text_badge: '' as string | null,
    active_path: '' as string | null,
    permission: '' as string | null
  })

  const rules: FormRules = {
    title: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }]
  }

  /**
   * 打开弹窗
   * @param row 编辑数据（MenuTreeItem 格式，null 表示新增）
   * @param treeData 菜单树数据（用于父级选择）
   * @param parentId 新增子菜单时的父级ID
   */
  const open = (row: MenuTreeItem | null, treeData: MenuTreeItem[], parentId?: number | null) => {
    dialogVisible.value = true
    menuTreeData.value = treeData

    if (row) {
      id.value = row.id
      Object.assign(form, {
        parent_id: row.parent_id,
        path: row.path,
        name: row.name,
        component: row.component,
        redirect: row.redirect,
        title: row.title,
        icon: row.icon,
        link: row.link,
        type: row.type.value,
        sort: row.sort,
        is_enable: row.is_enable,
        is_hide: row.is_hide,
        is_hide_tab: row.is_hide_tab,
        is_iframe: row.is_iframe,
        keep_alive: row.keep_alive,
        is_full_page: row.is_full_page,
        fixed_tab: row.fixed_tab,
        show_badge: row.show_badge,
        show_text_badge: row.show_text_badge,
        active_path: row.active_path,
        permission: row.permission
      })
    } else {
      id.value = null
      Object.assign(form, {
        parent_id: parentId ?? 0,
        path: '',
        name: '',
        component: '',
        redirect: '',
        title: '',
        icon: '',
        link: '',
        type: 1,
        sort: 0,
        is_enable: true,
        is_hide: false,
        is_hide_tab: false,
        is_iframe: false,
        keep_alive: false,
        is_full_page: false,
        fixed_tab: false,
        show_badge: false,
        show_text_badge: '',
        active_path: '',
        permission: ''
      })
    }
  }

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const data: Api.SystemManage.MenuSaveParams = {
          parent_id: form.parent_id,
          path: form.path || null,
          name: form.name || null,
          component: form.component || null,
          redirect: form.redirect || null,
          title: form.title,
          icon: form.icon || null,
          link: form.link || null,
          type: form.type,
          sort: form.sort,
          is_enable: form.is_enable,
          is_hide: form.is_hide,
          is_hide_tab: form.is_hide_tab,
          is_iframe: form.is_iframe,
          keep_alive: form.keep_alive,
          is_full_page: form.is_full_page,
          fixed_tab: form.fixed_tab,
          show_badge: form.show_badge,
          show_text_badge: form.show_text_badge || null,
          active_path: form.active_path || null,
          permission: form.permission || null
        }
        if (isEdit.value && id.value) {
          await fetchUpdateMenu(id.value, data)
        } else {
          await fetchCreateMenu(data)
        }
        dialogVisible.value = false
        emit('refresh')
      } finally {
        submitting.value = false
      }
    })
  }

  /**
   * 关闭弹窗
   */
  const handleClose = () => {
    formRef.value?.resetFields()
    dialogVisible.value = false
  }

  defineExpose({ open })
</script>
