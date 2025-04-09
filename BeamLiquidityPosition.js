// Force safer JavaScript code (e.g. forbids using undeclared variables, etc.).
"use strict";

// *** COMMENTS ***

// - This script must be called at end of <body>, or in <head> with keyword 'defer'.


// *** DISPLAY FORMATS ***

// Number formatter for normal amounts (limited fraction digits)
const formatAmount = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  notation: 'standard',
  minimumIntegerDigits: 1, // This is min and default for JS
  minimumFractionDigits: 8,
  maximumFractionDigits: 8, // We arbitrary limit this, for display purposes
  //minimumSignificantDigits: 1, // This is the min and default for JS
  //maximumSignificantDigits: 21, // This is the max for JS
  useGrouping: true,
  signDisplay: 'auto', // Display sign for negative numbers only.
  trailingZeroDisplay: 'auto' // Follows minimumFractionDigits (not compatible with Chrome 83)
});

// Number formatter for exact amounts (no limit on fraction digits)
const formatExact = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  notation: 'standard',
  minimumIntegerDigits: 1, // This is min and default for JS
  minimumFractionDigits: 8,
  maximumFractionDigits: 20, // This is apparently the max in Chrome 83...
  //minimumSignificantDigits: 1, // This is the min and default for JS
  //maximumSignificantDigits: 21, // This is the max for JS
  useGrouping: true,
  signDisplay: 'auto', // Display sign for negative numbers only.
  trailingZeroDisplay: 'auto' // Follows minimumFractionDigits (not compatible with Chrome 83)
});

// Number formatter for percentage
const formatPercent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  notation: 'standard',
  minimumIntegerDigits: 1, // This is min and default for JS
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
  //minimumSignificantDigits: 1, // This is the min and default for JS
  //maximumSignificantDigits: 21, // This is the max for JS
  useGrouping: false,
  signDisplay: 'auto', // Display sign for negative numbers only.
  //trailingZeroDisplay: 'stripIfInteger' // Remove the fraction digits if they are all zero (not compatible with Chrome 83)
});

// Format a duration as a human-readable string (because Intl.DurationFormat is not available in Chrome 83!)
function formatDuration(ms) {
  // Convert millisecond duration in each other time unit
  const days = Math.floor(ms / 86400000); // 1 day = 86,400,000 ms
  const hours = Math.floor(ms / (1000 * 60 * 60) % 24); // Remaining hours
  const minutes = Math.floor((ms / (1000 * 60)) % 60); // Remaining minutes
  //const seconds = Math.floor((ms /1000) % 60); // Remaining seconds

  // Make human-readable string (Remark: We ignore seconds here)
  let text ='';
  if (days > 0) { text += days + (days > 1 ? ' days, ' : ' day, ');}
  if (hours > 0) { text += hours + (hours > 1 ? ' hours, ' : ' hour, ');}
  if (minutes > 0) { text += minutes + (minutes > 1 ? ' minutes, ' : ' minute, ');}
  //if (seconds > 0) { text += seconds + (seconds > 1 ? ' seconds, ' : ' second, ');}
  // Replace last comma and space with a period
  text = text.replace(/, $/g,'.');

  return text;
}

// *** GLOBAL VARIABLES ***

// Address of the remote explorer node
//const urlPrefix = 'http://localhost:8888/';
//const urlPrefix = 'http://116.203.118.51:8100/';
const urlPrefix = 'https://explorer-api.beamprivacy.community/';

// Request 'nice' formatting from the node (timestamps as YYYYY-MM-DD, amounts as XXX,XXX,XXX.YYYYYYYY, etc.)
const urlSuffix = '?exp_am=1';

// DEX contract ID
const contractID = '729fe098d9fd2b57705db1a05a74103dd4b891f535aef2ae69b47bcfdeef9cbf';

// Fee Tier names and values (decimal)
const feeTiers = {'Low': '0.0005', 'Medium': '0.003', 'High': '0.01'}

// Variables to be displayed in the HTML (in elements with data-* attributes with the same names, but lowercase)
const g = {
  kernel: undefined, // Kernel of initial deposit
  initialHeight: undefined, // Blockheight of the initial deposit
  initialDate: undefined, // Date of the initial deposit
  //currentHeight: undefined, // Current blockheight
  currentDate: undefined, // Current date
  durationInPool: undefined, // Total duration since deposit
  AMML: undefined, // AMML Id of the pool considered
  feeTierValue: undefined, // Fee Tier value (decimal) of the pool
  feeTierName: undefined, // Fee Tier name of the pool
  AID1: undefined, // ID of Asset 1
  AID2: undefined, // ID of Asset 2
  AID1Name: undefined, // Name of Asset 1
  AID2Name: undefined, // Name of Asset 2
  AMMLName: undefined, // NAme of the AMML token
  initialAID1Amount: undefined, // Initial amount of Asset 1 deposited in the pool
  initialAID2Amount: undefined, // Initial amount of Asset 2 deposited in the pool
  initialAMMLAmount: undefined, // Initial amount of AMML tokens received
  initialPrice: undefined, // Initial price of asset 2 (vs asset 1)
  priceName1: undefined, // Primary price asset name
  priceName2: undefined, // Secondary price asset name
  poolAID1Amount: undefined, // Current total amount of Asset 1 in the pool
  poolAID2Amount: undefined, // Current total amount of Asset 2 in the pool
  poolAMMLAmount: undefined, // Current total amount of AMML tokens minted for the pool
  poolPrice: undefined, // Current price of asset 2 (vs asset 1)
  poolShare: undefined, // Current share of the pool
  AID1Principal: undefined, // Current position of Asset 1 (principal)
  AID2Principal: undefined, // Current position of Asset 2 (principal)
  AID1Fees: undefined, // Fees received in Asset 1
  AID2Fees: undefined, // Fees received in Asset 2
  AID1Total: undefined, // Total current position of Asset 1
  AID2Total: undefined, // Total current position of Asset 2
  totalInitialValue: undefined, // Total value of the initial position (in units of Asset 1 or 2)
  totalCurrentValue: undefined, // Total value of the current position (in units of Asset 1 or 2)
  totalHodlValue: undefined, // Total value if the coins had been held instead of deposited in LP (in units of Asset 1 or 2)
  totalProfit: undefined, // Profits made between initial and current position (in units of Asset 1 or 2)
  totalIL: undefined, // Impermanent Loss (in units of Asset 1 or 2)
  AIDPnL: undefined, // ID of the Asset used to compute PnL
  AIDPnLName: undefined, // Name of the Asset used to compute PnL
}
// Default text to display when the variable is 'undefined'
const defaultValue = {
  kernel: undefined,
  initialHeight: '-',
  initialDate: '',
  //currentHeight: '-',
  currentDate: '',
  durationInPool: '-',
  AMML: '-',
  feeTierValue: '%',
  feeTierName: 'Low / Medium / High',
  AID1: '-',
  AID2: '-',
  AID1Name: 'Asset-A',
  AID2Name: 'Asset-B',
  AMMLName: 'AMML',
  initialAID1Amount: '-',
  initialAID2Amount: '-',
  initialAMMLAmount: '-',
  initialPrice: '1',
  priceName1: 'Asset-A',
  priceName2: 'Asset-B',
  poolAID1Amount: '-',
  poolAID2Amount: '-',
  poolAMMLAmount: '-',
  poolPrice: '1',
  poolShare: '-',
  AID1Principal: '-',
  AID2Principal: '-',
  AID1Fees: '-',
  AID2Fees: '-',
  AID1Total: '-',
  AID2Total: '-',
  totalInitialValue: '-',
  totalCurrentValue: '-',
  totalHodlValue: '-',
  totalProfit: '-',
  totalIL: '-',
  AIDPnL: '-',
  AIDPnLName: 'Asset-A',
}
// Special display formats of certain variables
const displayFormat = {
  feeTierValue: formatPercent,
  initialAID1Amount: formatExact,
  initialAID2Amount: formatExact,
  initialAMMLAmount: formatExact,
  initialPrice: formatAmount,
  poolAID1Amount: formatAmount,
  poolAID2Amount: formatAmount,
  poolAMMLAmount: formatAmount,
  poolPrice: formatAmount,
  poolShare: formatPercent,
  AID1Principal: formatAmount,
  AID2Principal: formatAmount,
  AID1Fees: formatAmount,
  AID2Fees: formatAmount,
  AID1Total: formatAmount,
  AID2Total: formatAmount,
  totalInitialValue: formatAmount,
  totalCurrentValue: formatAmount,
  totalHodlValue: formatAmount,
  totalProfit: formatAmount,
  totalIL: formatAmount,
}

// *** FUNCTIONS ***

// Reset all global variables
function resetAll() {
  // Reset values of all global variables to 'undefined'
  for (let i in g) { g[i] = undefined; }
}

// Update HTML with the values of the global variables
function updateDisplay() {
  // Loop on all global variables
  for (let [entry, value] of Object.entries(g)) {
    // Display default text if the value is undefined
    let text = (value === undefined) ? defaultValue[entry] : value;
    // Use special format if value is defined
    if (displayFormat[entry] !== undefined && text != defaultValue[entry]) { text = displayFormat[entry].format(text); }
    // Get the data-* attribute corresponding to the global variable (same name, but lowercase)
    let data = '[data-' + entry.toLowerCase() + ']';
    // Add a span to the decimal dot (to allow special formatting)
    text = String(text).replace(".","<span class='dot'>.</span>");
    // Display the variable value everywhere in HTML
    document.querySelectorAll(data).forEach(e => { e.innerHTML = text; });
  }
  // For certain values, store the value sign in the data attributes
  document.querySelector('[data-totalprofit]').dataset.totalprofit = (g.totalProfit >= 0);
  document.querySelector('[data-totalil]').dataset.totalil = (g.totalIL >= 0);
}

// Launch a kernel search request
function submitKernelSearch() {
  // Get search string
  g.kernel = document.getElementById('SearchField').value;
  if (g.kernel) {
    // Build request to explorer node
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onload = parseKernelSearch;
    // Submit request to explorer node
    xmlhttp.open('GET', urlPrefix + 'block' + urlSuffix + '&kernel=' + g.kernel);
    xmlhttp.send();
  }
}

// Process the kernel search answer
function parseKernelSearch() {
  // Parse explorer node response
  const jData = JSON.parse(this.responseText);

  // Display error message if no block was found
  // Remark: The explorer node often returns the treasury when no block is found (and only the Treasury lacks the 'info' field)
  if (jData['found'] === false || jData['info'] === undefined) {
    alert('Block not found. Please use the Beam Explorer to verify the Kernel ID.');
    return;
  }

  // Parse "kernels" section
  let jTbl = jData['kernels'];
  if (jTbl) {
    // Loop on all kernels
    for (let i in jTbl) {
      let jRow = jTbl[i];
      // Check kernel ID
      if (jRow['id'] == g.kernel) {
        // Get contract call details
        // Remark: In the following tests, we use the optional chaining '?.' so that we get an 'undefined' instead of triggering an error, in case any of the properties doesn't exist.
        let jRow2 = jRow.Contract?.value?.[1];
        // Check if the kernel corresponds to a contract call
        if (jRow2 === undefined) {
          alert('Wrong type of transaction. Please provide the Kernel ID of a call to the DEX smart contract with method "Liquidity Add".');
          return;
        }
        // Check if contract ID is the one of the Beam DEX
        if (jRow2?.[0]?.value != contractID) {
          alert('Wrong Contract Id. Please provide the Kernel ID of a call to the DEX smart contract with method "Liquidity Add".');
          return;
        }
        // Check if the call is for adding liquidity to a pool
        if (jRow2?.[2] != "Liquidity Add") {
          alert('Wrong Method. Please provide the Kernel ID of a call to the DEX smart contract with method "Liquidity Add".');
          return;
        }

        // If everything seems ok, reset all global variables (except 'kernel') and their display
        let k = g.kernel;
        resetAll();
        g.kernel = k;
        updateDisplay();

        // Get values of initial deposit, and convert them to numbers.
        // Remark: JS might see the values as numbers or strings (depending on their having commas and spaces or not),
        // so we always convert to string first (to allow using 'replace' to remove commas and spaces) and then to number.

        // Get the asset ids
        g.AID1 = Number(jRow2[4].value[0][0].value);
        g.AID2 = Number(jRow2[4].value[1][0].value);
        g.AMML = Number(jRow2[5].value[0][0].value);
        // Define default asset names ("Asset-xx", or "BEAM" for id 0)
        g.AID1Name = (g.AID1 == 0) ? 'BEAM' : 'Asset-' + g.AID1;
        g.AID2Name = (g.AID2 == 0) ? 'BEAM' : 'Asset-' + g.AID2;

        // Get initial amounts
        g.initialAID1Amount = jRow2[4].value[0][1].value;
        g.initialAID1Amount = Number(String(g.initialAID1Amount).replace(/[+, ]/g,''));
        g.initialAID2Amount = jRow2[4].value[1][1].value;
        g.initialAID2Amount = Number(String(g.initialAID2Amount).replace(/[+, ]/g,''));
        g.initialAMMLAmount = jRow2[5].value[0][1].value;
        g.initialAMMLAmount = Number(String(g.initialAMMLAmount).replace(/[+, ]/g,''));
        g.feeTierName = jRow2[3].Volatility; // String
        g.feeTierValue = Number(feeTiers[g.feeTierName]);
        // Compute initial price
        computePrices();
      }
    }
  }

  // Parse "info" section
  let j = jData['info'];
  if (j) {
    // Get blockheight and date
    g.initialHeight = Number(j.value[0][1].value);
    let timeStamp = Number(j.value[1][1].value);
    // Format date as a string in UTC
    let d = new Date(); // Returns a date object with the current date and time (relative to local time zone).
    let date = new Date((timeStamp - d.getTimezoneOffset() * 60) * 1000);
    let txt = date.toISOString().split('T');
    g.initialDate = txt[0] + ' ' + txt[1].split('.')[0];
  }

  // Update values in HTML
  updateDisplay();
  // Query asset names
  submitAssetsQuery();
  // Get current status of the pool
  submitPoolQuery();
}

// Compute prices according to current unit
function computePrices() {
  // Define default price units (price is given as a value of 'priceName1 per priceName2')
  if (g.priceName1 === undefined) { g.priceName1 = g.AID1Name; g.priceName2 = g.AID2Name; }
  // Compute prices
  if (g.priceName1 == g.AID1Name) {
    // Compute initial price
    g.initialPrice = g.initialAID1Amount / g.initialAID2Amount;
    // Compute pool price (if the pool info is already available)
    if (g.poolAID1Amount !== undefined) { g.poolPrice = g.poolAID1Amount / g.poolAID2Amount; }
  }
  if (g.priceName1 == g.AID2Name) {
    // Compute initial price
    g.initialPrice = g.initialAID2Amount / g.initialAID1Amount;
    // Compute pool price (if the pool info is already available)
    if (g.poolAID2Amount !== undefined) { g.poolPrice = g.poolAID2Amount / g.poolAID1Amount; }
  }
}

// Switch the unit used for computing prices
function invertPrices() {
  // Only do something if a pool has already been defined
  if (!g.AMML) { return; };
  // Switch the units used to compute prices
  g.priceName1 = (g.priceName1 == g.AID1Name) ? g.AID2Name : g.AID1Name;
  g.priceName2 = (g.priceName2 == g.AID2Name) ? g.AID1Name : g.AID2Name;
  // Recompute prices
  computePrices();
  // Update values in HTML
  updateDisplay();
}

// Launch a request on Assets names
function submitAssetsQuery() {
  // Build request to explorer node
  const xmlhttp = new XMLHttpRequest();
  xmlhttp.onload = parseAssetsQuery;
  // Submit request to explorer node
  xmlhttp.open('GET', urlPrefix + 'assets' + urlSuffix);
  xmlhttp.send();
}

// Process the Assets names answer
function parseAssetsQuery() {
  // Remember current unit used for prices
  let priceID = (g.priceName1 == g.AID1Name) ? 1 : 2 ;
  // Define default asset names ("Asset-xx", or "BEAM" for id 0)
  g.AID1Name = (g.AID1 == 0) ? 'BEAM' : 'Asset-' + g.AID1;
  g.AID2Name = (g.AID2 == 0) ? 'BEAM' : 'Asset-' + g.AID2;
  // Parse explorer node response
  const jData = JSON.parse(this.responseText);
  const jTbl = jData['value'];
  // Skip first row (the headers) and look for other asset IDs
  for (let iRow = 1; iRow < jTbl.length; iRow++) {
    let jRow = jTbl[iRow];
    // Extract asset ID
    let aid = jRow[0]['value'];
    // Check if asset ID is one of the current ones
    if (aid == g.AID1 || aid == g.AID2) {
      // Extract asset metadata
      let metadata = jRow[5];
      // Check if data is a text string starting with "STD:" (i.e. it's an asset description)
      if (metadata.startsWith('STD:')) {
        // Extract asset short name (with a regexp)
        let name = metadata.replace(/.*;UN=([^;]*).*/,'$1');
        // Save idenfied name
        if (aid == g.AID1) { g.AID1Name = name; }
        if (aid == g.AID2) { g.AID2Name = name; }
      }
    }
  }
  // Also update current unit used for prices
  g.priceName1 = (priceID == 1) ? g.AID1Name : g.AID2Name;
  g.priceName2 = (priceID == 1) ? g.AID2Name : g.AID1Name;

  // Update values in HTML
  updateDisplay();
}

// Launch a request on current pool
function submitPoolQuery() {
  // Only do something if a pool has already been defined
  if (!g.AMML) { return; };
  // Build request to explorer node
  const xmlhttp = new XMLHttpRequest();
  xmlhttp.onload = parsePoolQuery;
  // Submit request to explorer node
  xmlhttp.open('GET', urlPrefix + 'contract' + urlSuffix + '&id=' + contractID + '&nMaxTxs=1');
  xmlhttp.send();
}

// Process the current pool answer
function parsePoolQuery() {
  // Parse explorer node response
  const jData = JSON.parse(this.responseText);

  // Format current date as a string
  let now = new Date(); // Returns a date object with the current date and time (relative to local time zone).
  let txt = now.toISOString().split('T');
  g.currentDate = txt[0] + ' ' + txt[1].split('.')[0];
  // Compute time spent in the pool
  let durationInMs = Date.parse(g.currentDate) - Date.parse(g.initialDate);
  g.durationInPool = formatDuration(durationInMs); // Human readable format

  // Parse "Pools" section
  let jTbl = jData['State']['Pools'].value;
  // Search corresponding pool
  if (jTbl) {
    for (let i in jTbl) {
      let jRow = jTbl[i];
      if (jRow[3].value == g.AMML) {
        // Get current values of liquidity pool and convert them to numbers
        // Remark: JS might see the values as numbers or strings (depending on their having commas and spaces or not),
        // so we always convert to string first (to allow using 'replace' to remove commas and spaces) and then to number.
        g.poolAID1Amount = jRow[4].value;
        g.poolAID1Amount = Number(String(g.poolAID1Amount).replace(/[+, ]/g,''));
        g.poolAID2Amount = jRow[5].value;
        g.poolAID2Amount = Number(String(g.poolAID2Amount).replace(/[+, ]/g,''));
        g.poolAMMLAmount = jRow[6].value;
        g.poolAMMLAmount = Number(String(g.poolAMMLAmount).replace(/[+, ]/g,''));
        // Compute pool price
        computePrices();
      }
    }
  }

  // Compute fees received
  computeFees();
  // Compute profit & loss
  computePnL();
  // Update values in HTML
  updateDisplay();
}

// Compute fees received
function computeFees() {
  // Compute pool share (in decimal)
  g.poolShare = g.initialAMMLAmount / g.poolAMMLAmount;
  // Compute current position (total), as share of the total pool
  g.AID1Total = g.poolAID1Amount * g.poolShare;
  g.AID2Total = g.poolAID2Amount * g.poolShare;
  // Compute current position (principal), based the on constant product formula
  let k = g.initialAID1Amount * g.initialAID2Amount;
  let p1 = g.poolAID1Amount / g.poolAID2Amount;
  let p2 = g.poolAID2Amount / g.poolAID1Amount;
  // Simple maths to get there...
  g.AID1Principal = Math.sqrt(k * p1);
  g.AID2Principal = Math.sqrt(k * p2);
  // Compute current position (received fees)
  g.AID1Fees = g.AID1Total - g.AID1Principal;
  g.AID2Fees = g.AID2Total - g.AID2Principal;
}

// Compute profit & loss
function computePnL() {
  // Only do something if a pool has already been defined
  if (!g.AMML) { return; };
  // Define active unit is not done yet
  if (g.AIDPnL === undefined) { g.AIDPnL = g.AID1; g.AIDPnLName = g.AID1Name; }
  if (g.AIDPnL == g.AID1) {
    // Liquidity pairs are always balanced, so total value is simply the double of any one
    g.totalInitialValue = 2 * g.initialAID1Amount;
    g.totalCurrentValue = 2 * g.AID1Total;
    // Current value (hypothetical) of the original amounts
    g.totalHodlValue = g.initialAID1Amount + (g.initialAID2Amount * g.poolAID1Amount / g.poolAID2Amount);
  }
  if (g.AIDPnL == g.AID2) {
    // Liquidity pairs are always balanced, so total value is simply the double of any one
    g.totalInitialValue = 2 * g.initialAID2Amount;
    g.totalCurrentValue = 2 * g.AID2Total;
    // Current value (hypothetical) of the original amounts
    g.totalHodlValue = (g.initialAID1Amount * g.poolAID2Amount / g.poolAID1Amount) + g.initialAID2Amount;
  }
  // Compute profit and IL
  g.totalProfit = g.totalCurrentValue - g.totalInitialValue;
  g.totalIL = g.totalCurrentValue - g.totalHodlValue;
}

// Switch the unit used for computing PnL
function invertPnL() {
  // Switch the unit used to compute PnL
  g.AIDPnLName = (g.AIDPnL == g.AID1) ? g.AID2Name : g.AID1Name;
  g.AIDPnL = (g.AIDPnL == g.AID1) ? g.AID2 : g.AID1;
  // Recompute PnL
  computePnL();
  // Update values in HTML
  updateDisplay();
}

// *** SCROLL BUTTONS ***

// When the user scrolls away 40px from top or bottom of the page, show the up or down buttons
function scrollFunction() {
  let myTopButton = document.getElementById('TopButton');
  if (document.body.scrollTop > 40 || document.documentElement.scrollTop > 40) {
    myTopButton.style.display = 'block';
  } else {
    myTopButton.style.display = 'none';
  }
  let myBottomButton = document.getElementById('BottomButton');
  if (Math.abs(document.body.scrollHeight - document.body.scrollTop - document.body.clientHeight) < 40 || Math.abs(document.documentElement.scrollHeight - document.documentElement.scrollTop - document.documentElement.clientHeight) < 40) {
    myBottomButton.style.display = 'none';
  } else {
    myBottomButton.style.display = 'block';
  }
}
// Scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
// Scroll to the bottom of the document
function bottomFunction() {
  document.body.scrollTop = Math.abs(document.body.scrollHeight - document.body.clientHeight); // For Safari
  document.documentElement.scrollTop = Math.abs(document.documentElement.scrollHeight - document.documentElement.clientHeight); // For Chrome, Firefox, IE and Opera
}

// *** EXECUTION ***

// Scroll buttons
window.onscroll = function () { scrollFunction() };

// Display default values in the newly loaded page
document.querySelector('.explorerNodeURL').textContent = urlPrefix;
updateDisplay();
