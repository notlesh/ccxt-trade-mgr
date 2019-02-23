const ccxt = require('ccxt');
const blessed = require('neo-blessed');

const kraken = new ccxt.kraken();

// Create a screen object.
let screen = blessed.screen({
  smartCSR: true
});

screen.title = 'my window title';

// Create a box perfectly centered horizontally and vertically.
let box = blessed.box({
  top: '0',
  right: '0',
  width: '50%',
  height: '50%',
  content: 'Ticker',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

// Append our box to the screen.
screen.append(box);

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

box.focus();

screen.render();

const watchList = [
"BTC/USD",
"ETH/USD"
];

const updateTickerWindow = async function() {
	let str = "";
	for (let symbol of watchList) {
		// TODO: await in loop is inefficient, should be able to fetch all in one
		// console.log("Fetching "+ symbol +"...");
		const ticker = await kraken.fetchTicker(symbol);
		str += ticker.symbol + ": "+ ticker.close + "\n";
	}
	box.setContent(str);
	screen.render();
};
const updateTickerWindowRecurring = async function(interval) {
	await updateTickerWindow();

	// notice that we wait for updateTickerWindow() to complete,
	// this is to avoid queueing up requests when there are delays
	setTimeout(() => {
		updateTickerWindowRecurring(interval);
	}, interval);
};

setTimeout(() => {
	updateTickerWindowRecurring(5000);
}, 100);
