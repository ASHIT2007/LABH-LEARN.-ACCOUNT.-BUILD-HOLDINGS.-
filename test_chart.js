import { createChart } from 'lightweight-charts';

// create a dummy DOM element
global.document = {
    createElement: () => ({ style: {}, appendChild: () => { } }),
};
global.window = { devicePixelRatio: 1 };

try {
    const chart = createChart(global.document.createElement('div'));
    console.log(Object.keys(chart).filter(k => typeof chart[k] === 'function'));
    console.log("Has addCandlestickSeries?", typeof chart.addCandlestickSeries === 'function');
} catch (e) {
    console.error(e.message);
}
