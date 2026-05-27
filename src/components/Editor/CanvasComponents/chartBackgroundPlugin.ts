import type { Plugin } from 'chart.js';

export const chartBackgroundPlugin: Plugin = {
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart, _args, options) => {
        const color = (options as { color?: string }).color;
        if (!color) {
            return;
        }

        const { ctx } = chart;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    },
};
