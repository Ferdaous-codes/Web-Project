import { Component, computed, input } from '@angular/core';

export interface BarChartItem {
  label: string;
  value: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <div class="space-y-2.5">
      @for (item of items(); track item.label) {
        <div class="group">
          <div class="flex items-baseline justify-between gap-2 mb-1">
            <span class="text-sm text-gray-700 truncate">{{ item.label }}</span>
            <span class="text-sm font-semibold text-gray-900 tabular-nums flex-shrink-0">{{ item.value }}</span>
          </div>
          <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
              [style.width.%]="percent(item.value)"
            ></div>
          </div>
        </div>
      }
      @if (items().length === 0) {
        <div class="text-center py-8 text-sm text-gray-400">Aucune donnée à afficher.</div>
      }
    </div>
  `
})
export class BarChartComponent {
  items = input.required<BarChartItem[]>();

  private maxValue = computed(() => {
    const max = Math.max(...this.items().map(i => i.value), 0);
    return max === 0 ? 1 : max;
  });

  percent(value: number): number {
    return Math.round((value / this.maxValue()) * 100);
  }
}
