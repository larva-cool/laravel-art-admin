<template>
  <div class="debug-panel">
    <!-- 顶部工具栏 -->
    <div class="art-card p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-2">
        <ArtSvgIcon icon="ri:bug-line" class="text-lg text-theme" />
        <h3 class="text-base font-medium text-g-900">调试面板</h3>
        <ElTag size="small" :type="statusTagType">{{ statusLabel }}</ElTag>
      </div>
      <div class="flex items-center gap-2">
        <ElInput
          v-model="tagFilter"
          placeholder="按标签筛选，如 admin:1"
          size="small"
          clearable
          style="width: 200px"
          @keyup.enter="reload"
          @clear="reload"
        />
        <ElButton size="small" @click="reload">筛选</ElButton>
        <ElButton :icon="Refresh" :loading="loading" size="small" circle @click="reload" />
        <ElButton
          v-auth="'debug.manage'"
          size="small"
          :type="status === 'paused' ? 'success' : 'warning'"
          @click="handleToggleRecording"
        >
          {{ status === 'paused' ? '恢复记录' : '暂停记录' }}
        </ElButton>
        <ElButton v-auth="'debug.manage'" size="small" type="danger" @click="handleClear">
          清空记录
        </ElButton>
      </div>
    </div>

    <div class="flex flex-col md:flex-row items-start gap-4">
      <!-- 左侧：类型导航 + 监控标签 -->
      <div class="w-full md:w-44 shrink-0">
        <div class="art-card p-4 mb-4">
          <div class="text-xs uppercase font-bold text-g-500 mb-2">条目类型</div>
          <div class="space-y-0.5">
            <div
              v-for="item in entryTypes"
              :key="item.value"
              class="flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-all duration-200"
              :class="
                type === item.value
                  ? 'bg-theme/10 text-theme font-medium'
                  : 'text-g-700 hover:bg-hover-color'
              "
              @click="handleTypeChange(item.value)"
            >
              <ArtSvgIcon :icon="item.icon" class="text-base shrink-0" />
              <span class="text-sm truncate">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div class="art-card p-4">
          <div
            class="text-xs uppercase font-bold text-g-500 mb-2"
            title="命中标签的条目将被强制记录"
          >
            监控标签
          </div>
          <div v-loading="tagsLoading">
            <div v-auth="'debug.manage'" class="flex items-center gap-1.5 mb-3">
              <ElInput
                v-model="newTag"
                placeholder="输入标签"
                size="small"
                @keyup.enter="handleMonitorTag"
              />
              <ElButton size="small" type="primary" @click="handleMonitorTag">添加</ElButton>
            </div>
            <p v-if="!monitoredTags.length" class="text-xs text-g-500">暂无监控标签</p>
            <div v-else class="flex flex-wrap gap-1.5">
              <ElTag
                v-for="tag in monitoredTags"
                :key="tag"
                size="small"
                closable
                @close="handleUnmonitorTag(tag)"
              >
                {{ tag }}
              </ElTag>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：条目列表 -->
      <div class="flex-1 min-w-0 w-full">
        <div class="art-card p-5">
          <div class="art-card-header">
            <div class="title">
              <h4>{{ currentTypeLabel }}</h4>
              <p>共加载 {{ entries.length }} 条，按时间倒序</p>
            </div>
          </div>

          <div v-loading="loading" class="mt-3">
            <ElEmpty v-if="!entries.length" description="暂无调试记录" :image-size="60" />
            <div v-else class="space-y-1.5">
              <div
                v-for="entry in entries"
                :key="entry.id"
                class="flex items-center gap-3 p-2.5 rounded-md cursor-pointer hover:bg-hover-color transition-all duration-200"
                @click="openDetail(entry)"
              >
                <ElTag v-if="entryBadge(entry)" size="small" :type="entryBadgeType(entry)">
                  {{ entryBadge(entry) }}
                </ElTag>
                <span
                  class="flex-1 text-xs text-g-800 truncate font-mono"
                  :title="entryTitle(entry)"
                >
                  {{ entryTitle(entry) }}
                </span>
                <span v-if="entryMeta(entry)" class="text-xs text-g-500 shrink-0">
                  {{ entryMeta(entry) }}
                </span>
                <span class="text-xs text-g-500 shrink-0 tabular-nums">
                  {{ formatTime(entry.created_at) }}
                </span>
              </div>
            </div>

            <div v-if="nextBefore !== null" class="mt-4 text-center">
              <ElButton size="small" :loading="loadingMore" @click="loadMore">加载更多</ElButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情抽屉（对齐原版 Telescope 详情结构） -->
    <ElDrawer
      v-model="detailVisible"
      :title="detailTitle"
      size="1000px"
      destroy-on-close
      class="debug-detail-drawer"
    >
      <div v-loading="detailLoading" class="detail-scroll">
        <template v-if="detail">
          <!-- 基础信息卡片 -->
          <div class="detail-card">
            <div class="detail-card-head">基础信息</div>
            <ElDescriptions :column="1" border size="small" class="detail-desc">
              <ElDescriptionsItem label="条目 ID">{{ detail.entry.id }}</ElDescriptionsItem>
              <ElDescriptionsItem label="主机名">{{
                detail.entry.content.hostname || '-'
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="记录时间">
                {{ formatTime(detail.entry.created_at) }}
                <span class="text-g-500">（{{ detail.entry.created_at }}）</span>
              </ElDescriptionsItem>

              <!-- 类型专属字段 -->
              <template v-if="detail.entry.type === 'request'">
                <ElDescriptionsItem label="方法">
                  <ElTag size="small" :type="entryBadgeType(detail.entry)">
                    {{ detail.entry.content.method }}
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="控制器动作">
                  {{ detail.entry.content.controller_action || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem v-if="detail.entry.content.middleware?.length" label="中间件">
                  {{ detail.entry.content.middleware.join(', ') }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="路径">{{ detail.entry.content.uri }}</ElDescriptionsItem>
                <ElDescriptionsItem label="状态码">
                  <ElTag
                    size="small"
                    :type="statusCodeTagType(detail.entry.content.response_status)"
                  >
                    {{ detail.entry.content.response_status }}
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="耗时">
                  {{ detail.entry.content.duration ?? '-' }} ms
                </ElDescriptionsItem>
                <ElDescriptionsItem label="IP 地址">
                  {{ detail.entry.content.ip_address || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="内存使用">
                  {{ detail.entry.content.memory || '-' }} MB
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'exception'">
                <ElDescriptionsItem label="类型">
                  <span class="font-mono text-xs">{{ detail.entry.content.class }}</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="位置">
                  {{ detail.entry.content.file }}:{{ detail.entry.content.line }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="出现次数">
                  <el-link type="primary" @click="filterByFamilyHash">查看同类型</el-link>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="解决时间">
                  <template v-if="detail.entry.content.resolved_at">
                    {{ detail.entry.content.resolved_at }}
                  </template>
                  <template v-else>
                    <ElButton
                      v-auth="'debug.manage'"
                      size="small"
                      type="success"
                      @click="handleResolve"
                    >
                      标记为已解决
                    </ElButton>
                  </template>
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'log'">
                <ElDescriptionsItem label="级别">
                  <ElTag size="small" :type="entryBadgeType(detail.entry)">
                    {{ detail.entry.content.level }}
                  </ElTag>
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'query'">
                <ElDescriptionsItem label="连接">
                  {{ detail.entry.content.connection }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="位置">
                  {{ detail.entry.content.file }}:{{ detail.entry.content.line }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="耗时">
                  <span :class="detail.entry.content.slow ? 'text-red-500 font-medium' : ''">
                    {{ detail.entry.content.time }} ms
                  </span>
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'model'">
                <ElDescriptionsItem label="模型">
                  <span class="font-mono text-xs">{{ detail.entry.content.model }}</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="动作">
                  <ElTag size="small" :type="entryBadgeType(detail.entry)">
                    {{ detail.entry.content.action }}
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="实例数">
                  {{ detail.entry.content.count ?? 1 }}
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'job'">
                <ElDescriptionsItem label="状态">
                  <ElTag size="small" :type="entryBadgeType(detail.entry)">
                    {{ detail.entry.content.status }}
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="任务">
                  <span class="font-mono text-xs">{{ detail.entry.content.name }}</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="连接">
                  {{ detail.entry.content.connection }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="队列">
                  {{ detail.entry.content.queue }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="尝试次数">
                  {{ detail.entry.content.tries ?? 1 }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="超时时间">
                  {{ detail.entry.content.timeout ?? '-' }} 秒
                </ElDescriptionsItem>
                <ElDescriptionsItem v-if="detail.entry.content.batch" label="批处理">
                  {{ detail.entry.content.batch }}
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'event'">
                <ElDescriptionsItem label="事件">
                  <span class="font-mono text-xs">{{ detail.entry.content.name }}</span>
                  <ElTag
                    v-if="detail.entry.content.broadcast"
                    size="small"
                    type="info"
                    class="ml-2"
                  >
                    Broadcast
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="监听器数">
                  {{ detail.entry.content.listeners?.length ?? 0 }}
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'cache'">
                <ElDescriptionsItem label="动作">
                  <ElTag size="small" :type="entryBadgeType(detail.entry)">
                    {{ detail.entry.content.type }}
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="键名">
                  <span class="font-mono text-xs">{{ detail.entry.content.key }}</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem
                  v-if="detail.entry.content.expiration !== undefined"
                  label="过期时间"
                >
                  {{ detail.entry.content.expiration }} 秒
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'redis'">
                <ElDescriptionsItem label="连接">
                  {{ detail.entry.content.connection }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="耗时">
                  {{ detail.entry.content.time }} ms
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'mail'">
                <ElDescriptionsItem label="Mailable">
                  <span class="font-mono text-xs">{{ detail.entry.content.mailable || '-' }}</span>
                  <ElTag v-if="detail.entry.content.queued" size="small" type="info" class="ml-2">
                    Queued
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="发件人">
                  {{
                    detail.entry.content.from
                      ?.map((f: any) => `${f.name} <${f.address}>`)
                      .join(', ') || '-'
                  }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="收件人">
                  {{ formatRecipients(detail.entry.content.to) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem v-if="detail.entry.content.replyTo" label="回复">
                  {{ formatRecipients(detail.entry.content.replyTo) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem v-if="detail.entry.content.cc" label="抄送">
                  {{ formatRecipients(detail.entry.content.cc) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem v-if="detail.entry.content.bcc" label="密送">
                  {{ formatRecipients(detail.entry.content.bcc) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="主题">
                  {{ detail.entry.content.subject || '-' }}
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'notification'">
                <ElDescriptionsItem label="通知">
                  <span class="font-mono text-xs">{{
                    detail.entry.content.notification || '-'
                  }}</span>
                  <ElTag v-if="detail.entry.content.queued" size="small" type="info" class="ml-2">
                    Queued
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="渠道">
                  {{ detail.entry.content.channel }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="接收者">
                  <span class="font-mono text-xs">{{
                    detail.entry.content.notifiable || '-'
                  }}</span>
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'gate'">
                <ElDescriptionsItem label="能力">
                  <span class="font-mono text-xs">{{ detail.entry.content.ability }}</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="结果">
                  <ElTag size="small" :type="entryBadgeType(detail.entry)">
                    {{ detail.entry.content.result }}
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem v-if="detail.entry.content.message" label="信息">
                  {{ detail.entry.content.message }}
                </ElDescriptionsItem>
                <ElDescriptionsItem v-if="detail.entry.content.file" label="位置">
                  {{ detail.entry.content.file }}:{{ detail.entry.content.line }}
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'command'">
                <ElDescriptionsItem label="命令">
                  <span class="font-mono text-xs">{{ detail.entry.content.command }}</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="退出码">
                  {{ detail.entry.content.exit_code ?? '-' }}
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'schedule'">
                <ElDescriptionsItem label="描述">
                  {{ detail.entry.content.description || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="命令">
                  <span class="font-mono text-xs">{{ detail.entry.content.command }}</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="表达式">
                  <span class="font-mono text-xs">{{ detail.entry.content.expression }}</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="用户">
                  {{ detail.entry.content.user }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="时区">
                  {{ detail.entry.content.timezone }}
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'view'">
                <ElDescriptionsItem label="视图">
                  <span class="font-mono text-xs">{{ detail.entry.content.name }}</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="路径">
                  <span class="font-mono text-xs">{{ detail.entry.content.path }}</span>
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'batch'">
                <ElDescriptionsItem label="状态">
                  <ElTag size="small" :type="entryBadgeType(detail.entry)">
                    {{ detail.entry.content.status }}
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem v-if="detail.entry.content.cancelledAt" label="取消时间">
                  {{ detail.entry.content.cancelledAt }}
                </ElDescriptionsItem>
                <ElDescriptionsItem v-if="detail.entry.content.finishedAt" label="完成时间">
                  {{ detail.entry.content.finishedAt }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="名称">
                  {{ detail.entry.content.name || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="连接">
                  {{ detail.entry.content.connection }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="队列">
                  {{ detail.entry.content.queue }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="总任务数">
                  {{ detail.entry.content.totalJobs }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="待处理">
                  {{ detail.entry.content.pendingJobs }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="已失败">
                  {{ detail.entry.content.failedJobs }}
                </ElDescriptionsItem>
              </template>

              <template v-else-if="detail.entry.type === 'client_request'">
                <ElDescriptionsItem label="方法">
                  <ElTag size="small" :type="entryBadgeType(detail.entry)">
                    {{ detail.entry.content.method }}
                  </ElTag>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="URI">
                  <span class="font-mono text-xs">{{ detail.entry.content.uri }}</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="状态码">
                  {{ detail.entry.content.response_status ?? 'N/A' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="耗时">
                  {{ detail.entry.content.duration ?? '-' }} ms
                </ElDescriptionsItem>
              </template>

              <ElDescriptionsItem v-if="relatedEntryLinks.length" label="关联条目">
                <div class="flex flex-wrap gap-2">
                  <el-link
                    v-for="link in relatedEntryLinks"
                    :key="link.type"
                    type="primary"
                    @click="loadDetail(link.id)"
                  >
                    查看{{ link.label }}
                  </el-link>
                </div>
              </ElDescriptionsItem>

              <ElDescriptionsItem v-if="detail.entry.tags.length" label="标签">
                <div class="flex flex-wrap gap-1">
                  <ElTag
                    v-for="tag in detail.entry.tags"
                    :key="tag"
                    size="small"
                    effect="plain"
                    @click="filterByTag(tag)"
                    class="cursor-pointer"
                  >
                    {{ tag }}
                  </ElTag>
                </div>
              </ElDescriptionsItem>
            </ElDescriptions>
          </div>

          <!-- 认证用户卡片 -->
          <div v-if="detail.entry.content.user && detail.entry.content.user.id" class="detail-card">
            <div class="detail-card-head">认证用户</div>
            <ElDescriptions :column="1" border size="small" class="detail-desc">
              <ElDescriptionsItem label="ID">{{ detail.entry.content.user.id }}</ElDescriptionsItem>
              <ElDescriptionsItem v-if="detail.entry.content.user.name" label="姓名">
                {{ detail.entry.content.user.name }}
              </ElDescriptionsItem>
              <ElDescriptionsItem v-if="detail.entry.content.user.email" label="邮箱">
                {{ detail.entry.content.user.email }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </div>

          <!-- 请求类：请求体 / 响应体 分两组卡片（对齐 Telescope 原版） -->
          <template v-if="requestDetailGroups.length">
            <div v-for="group in requestDetailGroups" :key="group.key" class="detail-card">
              <ElTabs v-model="group.active" class="detail-tabs">
                <ElTabPane
                  v-for="tab in group.tabs"
                  :key="tab.key"
                  :name="tab.key"
                  :label="tab.label"
                >
                  <pre v-if="tab.mode === 'json'" class="json-block">{{
                    formatJson(tab.data)
                  }}</pre>
                  <pre v-else class="json-block">{{ tab.data }}</pre>
                </ElTabPane>
              </ElTabs>
            </div>
          </template>

          <!-- 非请求类：单卡片内容 Tab -->
          <div v-else-if="detailTabs.length" class="detail-card">
            <ElTabs v-model="detailContentTab" class="detail-tabs">
              <ElTabPane
                v-for="tab in detailTabs"
                :key="tab.key"
                :name="tab.key"
                :label="tab.label"
              >
                <!-- JSON 数据展示 -->
                <pre v-if="tab.mode === 'json'" class="json-block">{{ formatJson(tab.data) }}</pre>

                <!-- 纯文本展示（异常消息等） -->
                <pre v-else-if="tab.mode === 'text'" class="json-block">{{ tab.data }}</pre>

                <!-- SQL 展示 -->
                <pre v-else-if="tab.mode === 'sql'" class="json-block">{{
                  formatSql(tab.data)
                }}</pre>
              </ElTabPane>
            </ElTabs>
          </div>

          <!-- 邮件预览（无 Tab，直接显示 HTML） -->
          <div v-if="detail.entry.type === 'mail' && detail.entry.content.html" class="detail-card">
            <div class="detail-card-head">邮件预览</div>
            <iframe
              :srcdoc="detail.entry.content.html"
              class="mail-iframe"
              sandbox="allow-same-origin"
            />
          </div>

          <!-- 同批次关联条目 -->
          <div v-if="relatedGroups.length" class="detail-card related-entries">
            <div class="detail-card-head">同批次关联条目</div>
            <ElTabs v-model="relatedTab">
              <ElTabPane
                v-for="group in relatedGroups"
                :key="group.type"
                :name="group.type"
                :label="`${group.label} (${group.entries.length})`"
              >
                <div class="related-head">
                  <div>
                    {{ relatedColumns(group.type)[0] }}
                    <small v-if="group.type === 'query'" class="related-summary">
                      {{ group.entries.length }} 条查询，{{ queriesSummary.duplicated }} 条重复
                    </small>
                  </div>
                  <div class="text-right">
                    {{ relatedColumns(group.type)[1] }}
                    <small v-if="group.type === 'query'" class="related-summary">
                      {{ queriesSummary.time }}ms
                    </small>
                  </div>
                </div>
                <div>
                  <div
                    v-for="item in group.entries"
                    :key="item.id"
                    class="related-row"
                    :class="
                      item.id === detail.entry.id
                        ? 'bg-theme/10'
                        : 'cursor-pointer hover:bg-hover-color'
                    "
                    @click="item.id !== detail.entry.id && loadDetail(item.id)"
                  >
                    <div class="min-w-0">
                      <div
                        class="text-xs text-g-800 truncate font-mono"
                        :title="relatedTitle(item)"
                      >
                        {{ relatedTitle(item) }}
                      </div>
                      <div
                        v-if="relatedSubtitle(item)"
                        class="mt-0.5 text-xs text-g-500 truncate"
                        :title="relatedSubtitle(item)"
                      >
                        {{ relatedSubtitle(item) }}
                      </div>
                    </div>
                    <div class="flex items-center justify-end gap-2 shrink-0">
                      <span v-if="entryMeta(item)" class="text-xs text-g-500 tabular-nums">
                        {{ entryMeta(item) }}
                      </span>
                      <ElTag
                        v-if="entryBadge(item) !== group.label"
                        size="small"
                        :type="entryBadgeType(item)"
                      >
                        {{ entryBadge(item) }}
                      </ElTag>
                    </div>
                  </div>
                </div>
              </ElTabPane>
            </ElTabs>
          </div>
        </template>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import {
    clearDebugEntries,
    fetchDebugEntries,
    fetchDebugEntry,
    fetchDebugTags,
    monitorDebugTag,
    resolveDebugException,
    toggleDebugRecording,
    unmonitorDebugTag,
    type DebugEntry,
    type DebugEntryResponse,
    type DebugEntryType,
    type DebugStatus
  } from '@/api/debug'
  import { Refresh } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'DebugPanel' })

  /** 条目类型导航配置 */
  const entryTypes: Array<{ value: DebugEntryType; label: string; icon: string }> = [
    { value: 'request', label: '请求', icon: 'ri:exchange-line' },
    { value: 'exception', label: '异常', icon: 'ri:error-warning-line' },
    { value: 'log', label: '日志', icon: 'ri:file-text-line' },
    { value: 'query', label: '数据库', icon: 'ri:database-2-line' },
    { value: 'model', label: '模型', icon: 'ri:box-3-line' },
    { value: 'job', label: '任务', icon: 'ri:task-line' },
    { value: 'batch', label: '批处理', icon: 'ri:stack-line' },
    { value: 'event', label: '事件', icon: 'ri:broadcast-line' },
    { value: 'cache', label: '缓存', icon: 'ri:hard-drive-2-line' },
    { value: 'redis', label: 'Redis', icon: 'ri:server-line' },
    { value: 'mail', label: '邮件', icon: 'ri:mail-line' },
    { value: 'notification', label: '通知', icon: 'ri:notification-3-line' },
    { value: 'gate', label: '授权', icon: 'ri:shield-keyhole-line' },
    { value: 'command', label: '命令', icon: 'ri:terminal-box-line' },
    { value: 'schedule', label: '调度', icon: 'ri:calendar-schedule-line' },
    { value: 'view', label: '视图', icon: 'ri:layout-line' },
    { value: 'dump', label: 'Dump', icon: 'ri:code-box-line' },
    { value: 'client_request', label: '外部请求', icon: 'ri:global-line' }
  ]

  const type = ref<DebugEntryType>('request')
  const status = ref<DebugStatus>('enabled')
  const entries = ref<DebugEntry[]>([])
  const nextBefore = ref<number | null>(null)
  const tagFilter = ref('')
  const loading = ref(false)
  const loadingMore = ref(false)

  const monitoredTags = ref<string[]>([])
  const newTag = ref('')
  const tagsLoading = ref(false)

  const detailVisible = ref(false)
  const detailLoading = ref(false)
  const detail = ref<DebugEntryResponse | null>(null)
  /** 当前激活的关联条目 Tab（对应条目类型） */
  const relatedTab = ref('')
  /** 详情内容 Tab 激活项 */
  const detailContentTab = ref('')

  /** 关联条目 Tab 顺序，与原版 Telescope 保持一致 */
  const relatedTabOrder: DebugEntryType[] = [
    'exception',
    'log',
    'view',
    'query',
    'model',
    'gate',
    'job',
    'mail',
    'notification',
    'event',
    'cache',
    'redis',
    'client_request'
  ]

  /** 详情抽屉标题 */
  const detailTitle = computed(() => {
    if (!detail.value) return '条目详情'
    return `${typeLabel(detail.value.entry.type)}详情`
  })

  /** 关联条目链接（同批次中的 request / job / command） */
  const relatedEntryLinks = computed(() => {
    const batch = detail.value?.batch ?? []
    const entryType = detail.value?.entry.type
    const linkTypes = [
      { type: 'request' as const, label: '请求' },
      { type: 'job' as const, label: '任务' },
      { type: 'command' as const, label: '命令' }
    ]
    return linkTypes
      .filter(({ type: t }) => t !== entryType)
      .map(({ type: t, label }) => {
        const item = batch.find((b) => b.type === t)
        return item ? { type: t, label, id: item.id } : null
      })
      .filter(Boolean) as Array<{ type: DebugEntryType; label: string; id: string }>
  })

  /** 请求类详情分组（请求组 / 响应组各一张卡片，对齐 Telescope 原版） */
  const requestDetailGroups = computed(() => {
    const entry = detail.value?.entry
    if (!entry || !['request', 'client_request'].includes(entry.type)) return []
    const content = entry.content
    const groups: Array<{
      key: string
      active: string
      tabs: Array<{ key: string; label: string; mode: 'json' | 'text'; data: unknown }>
    }> = []

    const reqTabs: (typeof groups)[0]['tabs'] = []
    if (content.payload !== undefined && content.payload !== null) {
      reqTabs.push({ key: 'payload', label: 'Payload', mode: 'json', data: content.payload })
    }
    if (content.headers) {
      reqTabs.push({ key: 'headers', label: 'Headers', mode: 'json', data: content.headers })
    }
    if (reqTabs.length) {
      groups.push({ key: 'request', active: reqTabs[0].key, tabs: reqTabs })
    }

    const resTabs: (typeof groups)[0]['tabs'] = []
    if (content.response !== undefined && content.response !== null) {
      resTabs.push({ key: 'response', label: 'Response', mode: 'json', data: content.response })
    }
    if (content.response_headers) {
      resTabs.push({
        key: 'response_headers',
        label: 'Headers',
        mode: 'json',
        data: content.response_headers
      })
    }
    if (content.session !== undefined) {
      resTabs.push({ key: 'session', label: 'Session', mode: 'json', data: content.session })
    }
    if (resTabs.length) {
      groups.push({ key: 'response', active: resTabs[0].key, tabs: resTabs })
    }
    return groups
  })

  /** 详情内容 Tab 配置（对齐 Telescope 原版的 after-attributes-card 区块） */
  const detailTabs = computed(() => {
    const entry = detail.value?.entry
    if (!entry) return []
    const content = entry.content
    const tabs: Array<{
      key: string
      label: string
      mode: 'json' | 'text' | 'sql'
      data: unknown
    }> = []

    switch (entry.type) {
      case 'request':
        tabs.push({ key: 'payload', label: 'Payload', mode: 'json', data: content.payload ?? {} })
        tabs.push({ key: 'headers', label: 'Headers', mode: 'json', data: content.headers ?? {} })
        tabs.push({
          key: 'response',
          label: 'Response',
          mode: 'json',
          data: content.response ?? {}
        })
        tabs.push({
          key: 'response_headers',
          label: '响应 Headers',
          mode: 'json',
          data: content.response_headers ?? {}
        })
        tabs.push({ key: 'session', label: 'Session', mode: 'json', data: content.session ?? {} })
        break
      case 'exception':
        tabs.push({ key: 'message', label: '消息', mode: 'text', data: content.message ?? '' })
        if (content.context) {
          tabs.push({ key: 'context', label: '上下文', mode: 'json', data: content.context })
        }
        if (content.trace) {
          tabs.push({
            key: 'trace',
            label: '堆栈',
            mode: 'text',
            data: content.trace.map((t: any, i: number) => `#${i} ${t.file}:${t.line}`).join('\n')
          })
        }
        break
      case 'log':
        tabs.push({ key: 'message', label: '日志消息', mode: 'text', data: content.message ?? '' })
        if (content.context) {
          tabs.push({ key: 'context', label: '上下文', mode: 'json', data: content.context })
        }
        break
      case 'query':
        tabs.push({ key: 'sql', label: 'SQL', mode: 'sql', data: content.sql ?? '' })
        if (content.bindings) {
          tabs.push({ key: 'bindings', label: '参数绑定', mode: 'json', data: content.bindings })
        }
        break
      case 'model':
        tabs.push({ key: 'changes', label: '变更', mode: 'json', data: content.changes ?? {} })
        if (content.original) {
          tabs.push({ key: 'original', label: '原始值', mode: 'json', data: content.original })
        }
        break
      case 'job':
        tabs.push({ key: 'payload', label: 'Data', mode: 'json', data: content.payload ?? {} })
        if (content.exception) {
          tabs.push({ key: 'exception', label: '异常消息', mode: 'text', data: content.exception })
        }
        if (content.trace) {
          tabs.push({ key: 'trace', label: '堆栈', mode: 'text', data: content.trace })
        }
        break
      case 'event':
        tabs.push({ key: 'payload', label: '事件数据', mode: 'json', data: content.payload ?? {} })
        if (content.listeners?.length) {
          tabs.push({ key: 'listeners', label: '监听器', mode: 'json', data: content.listeners })
        }
        break
      case 'cache':
        if (content.value !== undefined) {
          tabs.push({ key: 'value', label: '值', mode: 'json', data: content.value })
        }
        break
      case 'redis':
        tabs.push({ key: 'command', label: '命令', mode: 'text', data: content.command ?? '' })
        break
      case 'gate':
        tabs.push({ key: 'arguments', label: '参数', mode: 'json', data: content.arguments ?? [] })
        break
      case 'command':
        tabs.push({ key: 'arguments', label: '参数', mode: 'json', data: content.arguments ?? [] })
        tabs.push({ key: 'options', label: '选项', mode: 'json', data: content.options ?? {} })
        break
      case 'schedule':
        if (content.output) {
          tabs.push({ key: 'output', label: '输出', mode: 'text', data: content.output })
        }
        break
      case 'view':
        tabs.push({ key: 'data', label: '数据', mode: 'json', data: content.data ?? {} })
        if (content.composers?.length) {
          tabs.push({ key: 'composers', label: 'Composers', mode: 'json', data: content.composers })
        }
        break
      case 'client_request':
        if (content.payload)
          tabs.push({ key: 'payload', label: 'Payload', mode: 'json', data: content.payload })
        if (content.headers)
          tabs.push({ key: 'headers', label: 'Headers', mode: 'json', data: content.headers })
        if (content.response)
          tabs.push({ key: 'response', label: 'Response', mode: 'json', data: content.response })
        if (content.response_headers) {
          tabs.push({
            key: 'response_headers',
            label: '响应 Headers',
            mode: 'json',
            data: content.response_headers
          })
        }
        break
      default:
        tabs.push({ key: 'content', label: '内容', mode: 'json', data: content })
    }
    return tabs
  })
  const relatedGroups = computed(() => {
    const batch = detail.value?.batch ?? []
    return relatedTabOrder
      .map((groupType) => ({
        type: groupType,
        label: typeLabel(groupType),
        entries: batch.filter((item) => item.type === groupType)
      }))
      .filter((group) => group.entries.length > 0)
  })

  /** 查询类关联条目汇总（总耗时与重复条数） */
  const queriesSummary = computed(() => {
    const queries = detail.value?.batch.filter((item) => item.type === 'query') ?? []
    const time = queries.reduce((total, item) => total + parseFloat(item.content.time ?? 0), 0)
    const uniqueHashes = new Set(
      queries.map((item) => `${item.content.hash}-${item.content.connection}`)
    )
    return { time: time.toFixed(2), duplicated: queries.length - uniqueHashes.size }
  })

  /** 各类型关联条目的表头文案 [左列, 右列] */
  function relatedColumns(groupType: string): [string, string] {
    const map: Record<string, [string, string]> = {
      exception: ['异常信息', '位置'],
      log: ['日志内容', '级别'],
      view: ['视图', 'Composer 数'],
      query: ['查询语句', '耗时'],
      model: ['模型', '动作'],
      gate: ['权限', '结果'],
      job: ['任务', '状态'],
      mail: ['邮件', '状态'],
      notification: ['通知', '渠道'],
      event: ['事件', '监听器数'],
      cache: ['键名', '动作'],
      redis: ['命令', '耗时'],
      client_request: ['请求地址', '状态']
    }
    return map[groupType] ?? ['内容', '状态']
  }

  /** 关联条目主标题 */
  function relatedTitle(entry: DebugEntry): string {
    if (entry.type === 'exception') {
      return String(entry.content.class ?? '')
    }
    if (entry.type === 'mail') {
      return String(entry.content.mailable ?? '-')
    }
    if (entry.type === 'notification') {
      return String(entry.content.notification ?? '-')
    }
    return entryTitle(entry)
  }

  /** 关联条目副标题 */
  function relatedSubtitle(entry: DebugEntry): string {
    switch (entry.type) {
      case 'exception':
        return String(entry.content.message ?? '')
      case 'job':
        return `连接：${entry.content.connection ?? '-'} | 队列：${entry.content.queue ?? '-'}`
      case 'mail':
        return `主题：${entry.content.subject ?? '-'}`
      case 'notification':
        return `接收者：${entry.content.notifiable ?? '-'}`
      case 'view':
        return String(entry.content.path ?? '')
      default:
        return ''
    }
  }

  /** 类型对应的中文名 */
  function typeLabel(value: string): string {
    return entryTypes.find((item) => item.value === value)?.label ?? value
  }

  const currentTypeLabel = computed(() => typeLabel(type.value))

  const statusLabel = computed(() => {
    const map: Record<DebugStatus, string> = {
      enabled: '采集中',
      paused: '已暂停',
      disabled: '已禁用',
      off: '该类型未启用'
    }
    return map[status.value]
  })

  const statusTagType = computed<'success' | 'warning' | 'info' | 'danger'>(() => {
    switch (status.value) {
      case 'enabled':
        return 'success'
      case 'paused':
        return 'warning'
      case 'off':
        return 'info'
      default:
        return 'danger'
    }
  })

  /** 相对时间显示 */
  function formatTime(time: string): string {
    const diff = Date.now() - new Date(time.replace(' ', 'T')).getTime()
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return `${Math.max(seconds, 0)}秒前`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    return `${Math.floor(hours / 24)}天前`
  }

  /** JSON 美化输出 */
  function formatJson(content: unknown): string {
    return JSON.stringify(content, null, 2)
  }

  /** 条目左侧徽标文本（HTTP 方法 / 日志级别等） */
  function entryBadge(entry: DebugEntry): string {
    const content = entry.content
    switch (entry.type) {
      case 'request':
      case 'client_request':
        return String(content.method ?? '')
      case 'log':
        return String(content.level ?? '')
      case 'query':
        return content.slow ? 'SLOW' : 'SQL'
      case 'model':
        return String(content.action ?? '')
      case 'cache':
        return String(content.type ?? '')
      case 'job':
      case 'batch':
        return String(content.status ?? '')
      case 'gate':
        return String(content.result ?? '')
      default:
        return typeLabel(entry.type)
    }
  }

  /** 徽标颜色 */
  function entryBadgeType(
    entry: DebugEntry
  ): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
    const badge = entryBadge(entry).toUpperCase()
    if (['GET', 'PROCESSED', 'ALLOWED', 'HIT'].includes(badge)) return 'success'
    if (['POST', 'PUT', 'PATCH', 'WARNING', 'SLOW', 'PENDING'].includes(badge)) return 'warning'
    if (['DELETE', 'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY', 'FAILED', 'DENIED'].includes(badge)) {
      return 'danger'
    }
    return 'info'
  }

  /** 条目主标题 */
  function entryTitle(entry: DebugEntry): string {
    const content = entry.content
    switch (entry.type) {
      case 'request':
      case 'client_request':
        return String(content.uri ?? '')
      case 'exception':
        return `${content.class ?? ''}: ${content.message ?? ''}`
      case 'log':
        return String(content.message ?? '')
      case 'query':
        return String(content.sql ?? '')
      case 'model':
        return String(content.model ?? '')
      case 'job':
        return String(content.name ?? '')
      case 'batch':
        return String(content.name ?? content.batchId ?? '')
      case 'event':
        return String(content.name ?? '')
      case 'cache':
      case 'redis':
        return String(content.key ?? content.command ?? '')
      case 'mail':
        return String(content.subject ?? '')
      case 'notification':
        return String(content.notification ?? '')
      case 'gate':
        return String(content.ability ?? '')
      case 'command':
        return String(content.command ?? '')
      case 'schedule':
        return String(content.command ?? '')
      case 'view':
        return String(content.name ?? content.path ?? '')
      case 'dump':
        return String(content.dump ?? '').slice(0, 200)
      default:
        return formatJson(content).slice(0, 200)
    }
  }

  /** 条目右侧附加信息（状态码 / 耗时等） */
  function entryMeta(entry: DebugEntry): string {
    const content = entry.content
    switch (entry.type) {
      case 'request':
      case 'client_request':
        return [content.response_status, content.duration ? `${content.duration}ms` : '']
          .filter(Boolean)
          .join(' · ')
      case 'query':
        return content.time ? `${content.time}ms` : ''
      case 'job':
      case 'command':
      case 'schedule':
        return content.duration ? `${content.duration}ms` : ''
      case 'exception':
        return String(content.line ? `line ${content.line}` : '')
      default:
        return ''
    }
  }

  /** 加载条目列表 */
  async function loadEntries(before?: number): Promise<void> {
    const isMore = before !== undefined
    if (isMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    try {
      const res = await fetchDebugEntries({
        type: type.value,
        tag: tagFilter.value.trim() || undefined,
        before,
        take: 50
      })
      status.value = res.status
      entries.value = isMore ? [...entries.value, ...res.entries] : res.entries
      nextBefore.value = res.entries.length ? res.next_before : null
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  /** 重新加载（重置游标） */
  function reload(): void {
    nextBefore.value = null
    loadEntries()
  }

  /** 加载下一页 */
  function loadMore(): void {
    if (nextBefore.value === null) return
    loadEntries(nextBefore.value)
  }

  /** 切换条目类型 */
  function handleTypeChange(value: DebugEntryType): void {
    if (type.value === value) return
    type.value = value
    entries.value = []
    reload()
  }

  /** 加载监控标签 */
  async function loadTags(): Promise<void> {
    tagsLoading.value = true
    try {
      const res = await fetchDebugTags()
      monitoredTags.value = res.tags
    } finally {
      tagsLoading.value = false
    }
  }

  /** 新增监控标签 */
  async function handleMonitorTag(): Promise<void> {
    const tag = newTag.value.trim()
    if (!tag) {
      ElMessage.warning('请输入标签')
      return
    }
    const res = await monitorDebugTag(tag)
    monitoredTags.value = res.tags
    newTag.value = ''
  }

  /** 移除监控标签 */
  async function handleUnmonitorTag(tag: string): Promise<void> {
    const res = await unmonitorDebugTag(tag)
    monitoredTags.value = res.tags
  }

  /** 切换记录开关 */
  async function handleToggleRecording(): Promise<void> {
    const res = await toggleDebugRecording()
    ElMessage.success(res.message)
    reload()
  }

  /** 清空全部调试记录 */
  async function handleClear(): Promise<void> {
    await ElMessageBox.confirm('将删除全部调试记录，此操作不可恢复，是否继续？', '清空记录', {
      type: 'warning'
    })
    await clearDebugEntries()
    entries.value = []
    nextBefore.value = null
  }

  /** 加载条目详情 */
  async function loadDetail(id: string): Promise<void> {
    detailLoading.value = true
    try {
      detail.value = await fetchDebugEntry(id)
      relatedTab.value = relatedGroups.value[0]?.type ?? ''
      detailContentTab.value = detailTabs.value[0]?.key ?? ''
    } finally {
      detailLoading.value = false
    }
  }

  /** 状态码标签类型 */
  function statusCodeTagType(
    code: number | string | undefined
  ): 'success' | 'warning' | 'danger' | 'info' {
    const n = Number(code)
    if (n >= 200 && n < 300) return 'success'
    if (n >= 300 && n < 400) return 'info'
    if (n >= 400 && n < 500) return 'warning'
    return 'danger'
  }

  /** 格式化邮件收件人列表 */
  function formatRecipients(list?: Array<{ name?: string; address?: string }>): string {
    if (!list?.length) return '-'
    return list.map((r) => (r.name ? `${r.name} <${r.address}>` : r.address)).join(', ')
  }

  /** 格式化 SQL（仅做基础缩进占位，保持原文展示） */
  function formatSql(sql: string): string {
    return sql || ''
  }

  /** 按标签过滤列表（点击详情标签跳转） */
  function filterByTag(tag: string): void {
    tagFilter.value = tag
    detailVisible.value = false
    reload()
  }

  /** 按 family_hash 过滤同类型异常 */
  function filterByFamilyHash(): void {
    if (!detail.value?.entry.family_hash) return
    detailVisible.value = false
    // 当前接口暂无 family_hash 查询参数，先用类型刷新
    reload()
  }

  /** 打开详情抽屉 */
  function openDetail(entry: DebugEntry): void {
    detail.value = null
    detailVisible.value = true
    loadDetail(entry.id)
  }

  /** 标记异常已解决 */
  async function handleResolve(): Promise<void> {
    if (!detail.value) return
    const res = await resolveDebugException(detail.value.entry.id)
    detail.value = { ...detail.value, entry: res.entry }
    reload()
  }

  onMounted(() => {
    loadEntries()
    loadTags()
  })
</script>

<style scoped>
  .debug-panel {
    padding: 4px;
  }

  .detail-scroll {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .detail-card {
    margin-bottom: 16px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .detail-card-head {
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--art-gray-900);
    border-bottom: 1px solid var(--default-border);
  }

  .detail-desc {
    :deep(.el-descriptions__label) {
      width: 120px;
      font-weight: 400;
      color: var(--art-gray-500);
    }

    :deep(.el-descriptions__body) {
      padding: 12px 16px;
    }
  }

  .detail-tabs {
    padding: 0;

    :deep(.el-tabs__header) {
      padding: 12px 0 0;
      margin: 0 16px;
      border-bottom: 1px solid var(--default-border);
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      height: 32px;
      font-size: 13px;
      color: var(--art-gray-600);

      &.is-active {
        font-weight: 500;
        color: var(--theme-color);
      }
    }

    :deep(.el-tabs__active-bar) {
      height: 2px;
      background-color: var(--theme-color);
    }

    :deep(.el-tabs__content) {
      padding: 12px 16px 16px;
    }
  }

  .json-block {
    max-height: 420px;
    padding: 14px 16px;
    margin: 0;
    overflow: auto;
    font-family: var(--el-font-family-mono, monospace);
    font-size: 12.5px;
    line-height: 1.65;
    color: var(--art-gray-800);
    word-break: break-all;
    white-space: pre-wrap;
    background: var(--art-gray-100);
    border: 1px solid var(--art-gray-200);
    border-radius: calc(var(--custom-radius) / 2);
    scrollbar-width: thin;
    scrollbar-color: var(--art-gray-300) transparent;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--art-gray-300);
      border-radius: 3px;
    }
  }

  .mail-iframe {
    width: 100%;
    min-height: 400px;
    background: #fff;
    border: 0;
  }

  .related-entries :deep(.el-tabs__header) {
    margin: 0 16px;
  }

  .related-entries :deep(.el-tabs__content) {
    min-height: 160px;
    max-height: 320px;
    padding: 0 16px 16px;
    overflow-y: auto;
  }

  .related-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--art-gray-500);
    border-bottom: 1px solid var(--default-border);

    .related-summary {
      margin-left: 8px;
      font-weight: 400;
      color: var(--art-gray-400);
    }
  }

  .related-row {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--default-border);
    transition: all 0.2s ease;

    &:last-child {
      border-bottom: 0;
    }
  }
</style>
