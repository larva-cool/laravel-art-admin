<template>
  <div ref="chartRef" class="metrics-chart"></div>
</template>

<script setup lang="ts">
  import { echarts, type EChartsOption } from '@/plugins/echarts'
  import { useSettingStore } from '@/store/modules/setting'
  import { getCssVar } from '@/utils/ui'
  import { storeToRefs } from 'pinia'
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { HorizonMetricSnapshot } from '@/api/queue'

  const { t } = useI18n()

  const props = defineProps<{
    snapshots: HorizonMetricSnapshot[]
    metric: 'throughput' | 'runtime'
  }>()

  const chartRef = ref<HTMLElement>()
  let chart: echarts.ECharts | null = null
  const settingStore = useSettingStore()
  const { isDark } = storeToRefs(settingStore)

  function safeHex(color: string): string {
    const c = color.trim()
    if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(c)) return c
    return '#409eff'
  }

  function themeColor(): string {
    return safeHex(getCssVar('--el-color-primary'))
  }

  function buildOption(): EChartsOption {
    const primary = themeColor()
    const isDarkMode = isDark.value
    const textColor = isDarkMode ? '#aaa' : '#666'
    const splitLineColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

    const labels = props.snapshots.map((s) => s.time)
    const values = props.snapshots.map((s) =>
      props.metric === 'throughput' ? s.throughput : s.runtime
    )
    const metricLabel =
      props.metric === 'throughput' ? t('monitor.horizon.throughput') : t('monitor.horizon.runtime')

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
        borderColor: isDarkMode ? '#333' : '#ddd',
        borderWidth: 1,
        textStyle: { color: isDarkMode ? '#fff' : '#333' }
      },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: textColor, fontSize: 10 },
        axisLine: { lineStyle: { color: splitLineColor } }
      },
      yAxis: {
        type: 'value',
        name: metricLabel,
        nameTextStyle: { color: textColor, fontSize: 10 },
        axisLabel: { color: textColor, fontSize: 10 },
        splitLine: { lineStyle: { color: splitLineColor } }
      },
      series: [
        {
          name: metricLabel,
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: values,
          lineStyle: { width: 2, color: primary },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: primary + '30' },
              { offset: 1, color: primary + '00' }
            ])
          }
        }
      ]
    }
  }

  function renderChart() {
    if (!chartRef.value || !props.snapshots.length) return
    if (!chart) chart = echarts.init(chartRef.value)
    chart.setOption(buildOption(), true)
  }

  function handleResize() {
    chart?.resize()
  }

  onMounted(() => {
    renderChart()
    window.addEventListener('resize', handleResize)
  })

  watch(() => props.snapshots, renderChart, { deep: true })
  watch(isDark, renderChart)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    chart?.dispose()
    chart = null
  })
</script>

<style scoped>
  .metrics-chart {
    width: 100%;
    height: 240px;
  }
</style>
