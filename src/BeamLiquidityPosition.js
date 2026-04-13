// Force safer JavaScript code (e.g. forbids using undeclared variables, etc.).
'use strict';

// *** COMMENTS ***

// - This script file must be called at end of <body>, or in <head> with keyword 'defer'.

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
  //trailingZeroDisplay: 'auto', // Follows minimumFractionDigits (not compatible with Chrome 83)
  signDisplay: 'auto' // Display sign for negative numbers only.
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
  //trailingZeroDisplay: 'auto', // Follows minimumFractionDigits (not compatible with Chrome 83)
  signDisplay: 'auto' // Display sign for negative numbers only.
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
  //trailingZeroDisplay: 'stripIfInteger' ,// Remove the fraction digits if they are all zero (not compatible with Chrome 83)
  signDisplay: 'auto' // Display sign for negative numbers only.
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

// List of remote explorer nodes
const DEFAULT_NODES = [
  'https://BeamSmart.net:8000/',
  'https://explorer.0xmx.net/api/',
  'https://explorer-api.beamprivacy.community/'
];
let currentNodeUrl = localStorage.getItem('beam_node_url') || DEFAULT_NODES[0];
let customNodes = JSON.parse(localStorage.getItem('beam_custom_nodes') || '[]');

// Request 'nice' formatting from the node
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
  currentHeight: undefined, // Current blockheight
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
  priceAID1: undefined, // Primary price asset id
  priceAID2: undefined, // Secondary price asset id
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
  totalProfit: undefined, // Profits made between initial and current position (in units of Asset 1 or 2)
  totalAllInAsset1Value: undefined, // Total value if all coins were swapped to Asset 1 at start
  totalAllInAsset1Profit: undefined, // Profit/Loss compared to All in Asset 1
  totalAllInAsset2Value: undefined, // Total value if all coins were swapped to Asset 2 at start
  totalAllInAsset2Profit: undefined, // Profit/Loss compared to All in Asset 2
  totalROI: undefined, // Return on Investment (ratio)
  totalAPR: undefined, // Annual Percentage Rate (ratio)
  priceChange: undefined, // Price change of the pair (ratio)
  AIDPnL: undefined, // ID of the Asset used to compute PnL
  AIDPnLName: undefined, // Name of the Asset used to compute PnL
  hypoCurrentValue: undefined, // Current worth for Hypo block
  hypoHodlValue: undefined, // Total worth if the coins had been held instead of deposited in LP (in units of Asset 1 or 2)
  hypoHodlDiff: undefined, // Difference of current with the Hodl scenario
  hypoA1Value: undefined, // Total worth if the coins had been held all in Asset 1 instead of deposited in LP (in units of Asset 1 or 2)
  hypoA1Diff: undefined, // Difference of current with the all-in-Asset-1 scenario
  hypoA2Value: undefined, // Total worth if the coins had been held all in Asset 2 instead of deposited in LP (in units of Asset 1 or 2)
  hypoA2Diff: undefined, // Difference of current with the all-in-Asset-2 scenario
  AIDHypo: undefined, // ID of the Asset used to compute Hypotheticals
  AIDHypoName: undefined, // Name of the Asset used to compute Hypotheticals
  AIDAnalytics: undefined, // ID of the Asset used as unit for Analytics
  AIDAnalyticsName: undefined, // Name of the Asset used as unit for Analytics
}
// Default text to display when the variable is 'undefined'
const defaultValue = {
  kernel: undefined,
  initialHeight: '-',
  initialDate: '',
  currentHeight: '-',
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
  totalProfit: '-',
  totalAllInAsset1Value: '-',
  totalAllInAsset1Profit: '-',
  totalAllInAsset2Value: '-',
  totalAllInAsset2Profit: '-',
  totalROI: '-',
  totalAPR: '-',
  priceChange: '-',
  AIDPnL: '-',
  AIDPnLName: 'Asset-A',
  hypoCurrentValue: '-',
  hypoHodlValue: '-',
  hypoHodlDiff: '-',
  hypoA1Value: '-',
  hypoA1Diff: '-',
  hypoA2Value: '-',
  hypoA2Diff: '-',
  AIDHypo: '-',
  AIDHypoName: 'Asset-A',
  AIDAnalytics: '-',
  AIDAnalyticsName: 'Asset-A',
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
  totalProfit: formatAmount,
  totalAllInAsset1Value: formatAmount,
  totalAllInAsset1Profit: formatAmount,
  totalAllInAsset2Value: formatAmount,
  totalAllInAsset2Profit: formatAmount,
  totalROI: formatPercent,
  totalAPR: formatPercent,
  priceChange: formatPercent,
  hypoCurrentValue: formatAmount,
  hypoHodlValue: formatAmount,
  hypoHodlDiff: formatAmount,
  hypoA1Value: formatAmount,
  hypoA1Diff: formatAmount,
  hypoA2Value: formatAmount,
  hypoA2Diff: formatAmount,
}

// *** FUNCTIONS ***

// Truncate asset name to 8 characters + ellipsis if longer
function truncateAssetName(name) {
  if (typeof name !== 'string') return name;
  return (name.length > 8) ? name.substring(0, 8) + '…' : name;
}

// Reset all global variables
function resetAll() {
  // Reset values of all global variables to 'undefined'
  for (let i in g) { g[i] = undefined; }
  resetSimulator();
}

// Manage Node Selector
function initNodeSelector() {
  const nodeSelector = document.getElementById('NodeSelector');
  const nodeDropdown = document.getElementById('NodeDropdown');
  
  // Toggle dropdown on click
  nodeSelector.onclick = (e) => {
    e.stopPropagation();
    const isVisible = nodeDropdown.style.display === 'flex';
    nodeDropdown.style.display = isVisible ? 'none' : 'flex';
  };

  // Close dropdown when clicking outside
  window.onclick = (e) => {
    if (nodeDropdown.style.display === 'flex') {
      if (!nodeDropdown.contains(e.target) && !nodeSelector.contains(e.target)) {
        nodeDropdown.style.display = 'none';
      }
    }
  };

  renderNodeDropdown();
  updateNodeDisplay();
  checkNodeStatus();
}

function renderNodeDropdown() {
  const nodeDropdown = document.getElementById('NodeDropdown');
  nodeDropdown.innerHTML = '';

  // Default nodes
  DEFAULT_NODES.forEach(url => {
    const option = document.createElement('div');
    option.className = `node-option ${url === currentNodeUrl ? 'active' : ''}`;
    option.innerHTML = `<span>${url}</span>`;
    option.onclick = (e) => {
      e.stopPropagation();
      selectNode(url);
      nodeDropdown.style.display = 'none';
    };
    nodeDropdown.appendChild(option);
  });

  // Custom nodes from localStorage
  customNodes.forEach((url, index) => {
    const option = document.createElement('div');
    option.className = `node-option custom ${url === currentNodeUrl ? 'active' : ''}`;
    option.innerHTML = `
      <span>${url}</span>
      <button class='delete-node' title='Remove custom node' onclick='deleteCustomNode(${index}, event)'>&times;</button>
    `;
    option.onclick = (e) => {
      e.stopPropagation();
      if (e.target.tagName !== 'BUTTON') {
        selectNode(url);
        nodeDropdown.style.display = 'none';
      }
    };
    nodeDropdown.appendChild(option);
  });

  // Add custom node input area
  const addArea = document.createElement('div');
  addArea.className = 'node-option add-custom-area';
  // Stop propagation on the whole area to prevent closing when clicking whitespace
  addArea.onclick = (e) => e.stopPropagation();
  addArea.innerHTML = `
    <input type='text' id='CustomNodeInput' placeholder='https://...' onclick='event.stopPropagation()'>
    <button id='AddNodeBtn' onclick='handleAddCustomNode(event)'>Add</button>
  `;
  nodeDropdown.appendChild(addArea);
}

function handleAddCustomNode(event) {
  event.stopPropagation();
  const input = document.getElementById('CustomNodeInput');
  const customUrl = input.value.trim();
  
  if (customUrl && (customUrl.toLowerCase().startsWith('http://') || customUrl.toLowerCase().startsWith('https://'))) {
    const lowerUrl = customUrl.toLowerCase();
    
    // Check if it already exists in defaults or custom (case-insensitive)
    const existingDefault = DEFAULT_NODES.find(node => node.toLowerCase() === lowerUrl);
    const existingCustom = customNodes.find(node => node.toLowerCase() === lowerUrl);

    if (!existingDefault && !existingCustom) {
      customNodes.push(customUrl);
      localStorage.setItem('beam_custom_nodes', JSON.stringify(customNodes));
      selectNode(customUrl);
      renderNodeDropdown();
    } else {
      // If it already exists, select the existing one (to keep its original casing)
      selectNode(existingDefault || existingCustom);
    }
    input.value = '';
    // Close dropdown after adding
    document.getElementById('NodeDropdown').style.display = 'none';
  } else if (customUrl) {
    alert('Please enter a valid URL starting with http:// or https://');
  }
}

function deleteCustomNode(index, event) {
  event.stopPropagation();
  const deletedUrl = customNodes[index];
  customNodes.splice(index, 1);
  localStorage.setItem('beam_custom_nodes', JSON.stringify(customNodes));
  
  if (currentNodeUrl === deletedUrl) {
    selectNode(DEFAULT_NODES[0]);
  }
  renderNodeDropdown();
}

function updateNodeDisplay() {
  const nodeCurrentName = document.getElementById('NodeCurrentName');
  const url = new URL(currentNodeUrl);
  nodeCurrentName.textContent = url.hostname;

  // Reset node status classes
  const nodeStatusIcon = document.getElementById('NodeStatusIcon');
  nodeStatusIcon.classList.remove('online', 'offline');

  // Update active class in dropdown
  const options = document.querySelectorAll('.node-option');
  options.forEach(opt => {
    const span = opt.querySelector('span');
    if (span && span.textContent === currentNodeUrl) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });

  // Update 'About' section
  const explorerNodeURL = document.querySelector('.explorerNodeURL');
  if (explorerNodeURL) explorerNodeURL.textContent = currentNodeUrl;
}

function selectNode(url) {
  currentNodeUrl = url;
  localStorage.setItem('beam_node_url', url);
  updateNodeDisplay();
  checkNodeStatus();
  // Trigger a refresh of data if a search was already performed
  if (document.getElementById('SearchField').value) {
    submitKernelSearch();
  }
}

async function checkNodeStatus() {
  const nodeStatusIcon = document.getElementById('NodeStatusIcon');
  if (!nodeStatusIcon) return;
  
  // For simplicity, we'll try to fetch the base URL with a short timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // Set timeout to 5s
  try {
    await fetch(currentNodeUrl, { 
      method: 'GET', 
      mode: 'no-cors', // Many nodes won't have CORS enabled for simple GET
      signal: controller.signal 
    });
    nodeStatusIcon.classList.remove('offline');
    nodeStatusIcon.classList.add('online');
  } catch (error) {
    // Only log actual errors, not timeouts (aborts)
    if (error.name !== 'AbortError') {
      console.error('Node status check failed:', error);
    }
    nodeStatusIcon.classList.remove('online');
    nodeStatusIcon.classList.add('offline');
  } finally {
    clearTimeout(timeoutId);
  }
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
  // For certain values, store the value sign (true or false) in the data attributes
  const signedAttributes = ['totalProfit', 'totalROI', 'totalAPR', 'priceChange', 'hypoHodlDiff', 'hypoA1Diff', 'hypoA2Diff'];
  signedAttributes.forEach(item => { // Loop on all elements with each of those data attributes
    const value = g[item];
    // Remark: 'value >= 0' with 'undefined' or '-' would return 'false' (i.e. negative color)
    const sign = (typeof value === 'number') ? (value >= 0) : '';
    document.querySelectorAll(`[data-${item.toLowerCase()}]`).forEach(e => e.setAttribute('data-profit-sign', sign));
  });
  // Update active tab and redraw charts
  const activeTabId = document.querySelector('.tab-btn.active')?.id;
  switchTab(activeTabId);
}

// Launch a kernel search request
function submitKernelSearch() {
  // Get search string
  g.originalSearch = document.getElementById('SearchField').value.trim();
  g.kernel = g.originalSearch;
  if (g.kernel) {
    updateURL(g.kernel);
    // Determine if it's a blockheight (1-9 digits) or a kernel ID
    let isHeight = /^\d{1,9}$/.test(g.kernel);
    let queryParam = isHeight ? '&height=' : '&kernel=';
    // Build request to explorer node
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onload = parseKernelSearch;
    // Submit request to explorer node
    xmlhttp.open('GET', currentNodeUrl + 'block' + urlSuffix + queryParam + g.kernel);
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
    alert('Block not found. Please use the Beam Explorer to check the Kernel ID or Block height.');
    updateURL(null);
    return;
  }

  // Parse "kernels" section
  let jTbl = jData['kernels'];
  let validKernels = [];
  let isKernelSearch = /^[0-9a-fA-F]{64}$/.test(g.kernel);

  if (jTbl) {
    // Loop on all kernels
    for (let i in jTbl) {
      let jRow = jTbl[i];
      // Check kernel ID if it's a kernel search
      if (isKernelSearch && jRow['id'] !== g.kernel) continue;

      // Get contract call details
      // Remark: We use the optional chaining '?.' so that we get an 'undefined' instead of an error, if the properties doesn't exist.
      let jRow2 = jRow.Contract?.value?.[1];
      // Check if it's a valid DEX "Liquidity Add" call
      if (jRow2 !== undefined && jRow2?.[0]?.value == contractID && jRow2?.[2] == "Liquidity Add") {
        validKernels.push({id: jRow['id'], data: jRow2});
      }
    }
  }

  // Handle results
  if (validKernels.length === 0) {
    if (isKernelSearch) {
      alert('Wrong type of transaction. Please provide the Kernel ID of a call to the DEX smart contract with method "Liquidity Add".');
    } else {
      alert('No valid "Liquidity Add" transaction found in this block.');
    }
    updateURL(null);
    return;
  }
  if (validKernels.length > 1) {
    alert('Multiple valid DEX transactions found in this block. Please search using the specific Kernel ID instead.');
    updateURL(null);
    return;
  }

  // Exactly one valid kernel found
  let kData = validKernels[0];
  let jRow2 = kData.data;

  // If everything seems ok, reset all global variables and their display
  resetAll();
  g.kernel = kData.id;
  updateDisplay();

  // Update favorite button state
  updateStarState();

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
  if (g.priceAID1 === undefined) { 
    g.priceAID1 = g.AID1; g.priceName1 = g.AID1Name; 
    g.priceAID2 = g.AID2; g.priceName2 = g.AID2Name; 
  }
  // Compute prices
  if (g.priceAID1 == g.AID1) {
    // Compute initial price
    g.initialPrice = g.initialAID1Amount / g.initialAID2Amount;
    // Compute pool price (if the pool info is already available)
    if (g.poolAID1Amount !== undefined) { g.poolPrice = g.poolAID1Amount / g.poolAID2Amount; }
  }
  if (g.priceAID1 == g.AID2) {
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
  // Switch the asset (id and name) used as unit to compute prices
  [g.priceAID1, g.priceAID2, g.priceName1, g.priceName2] =
    (g.priceAID1 == g.AID1) ? 
    [g.AID2, g.AID1, g.AID2Name, g.AID1Name] : 
    [g.AID1, g.AID2, g.AID1Name, g.AID2Name];
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
  xmlhttp.open('GET', currentNodeUrl + 'assets' + urlSuffix);
  xmlhttp.send();
}

// Process the Assets names answer
function parseAssetsQuery() {
  // Remember current unit used for prices
  let priceID = (g.priceAID1 == g.AID1) ? 1 : 2 ;
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
        if (aid == g.AID1) { g.AID1Name = truncateAssetName(name); }
        if (aid == g.AID2) { g.AID2Name = truncateAssetName(name); }
      }
    }
  }
  // Also update current unit used for prices
  g.priceName1 = (priceID == 1) ? g.AID1Name : g.AID2Name;
  g.priceName2 = (priceID == 1) ? g.AID2Name : g.AID1Name;

  // Update values in HTML
  updateDisplay();

  // Update favorite info if current kernel is a favorite
  const favIndex = favorites.findIndex(f => f.kernel === g.kernel);
  if (favIndex !== -1) {
    favorites[favIndex].aid1 = g.AID1Name;
    favorites[favIndex].aid2 = g.AID2Name;
    favorites[favIndex].initialHeight = g.initialHeight;
    localStorage.setItem('beam_lp_favorites', JSON.stringify(favorites));
  }
}

// Launch a request on current pool
function submitPoolQuery() {
  // Only do something if a pool has already been defined
  if (!g.AMML) { return; };
  // Build request to explorer node
  const xmlhttp = new XMLHttpRequest();
  xmlhttp.onload = parsePoolQuery;
  // Submit request to explorer node
  xmlhttp.open('GET', currentNodeUrl + 'contract' + urlSuffix + '&id=' + contractID + '&nMaxTxs=1');
  xmlhttp.send();
}

// Process the current pool answer
function parsePoolQuery() {
  // Parse explorer node response
  const jData = JSON.parse(this.responseText);

  // Get current block height
  g.currentHeight = jData['h'];

  // Format current date as a string
  let now = new Date(); // Returns a date object with the current date and time (relative to local time zone).
  let txt = now.toISOString().split('T');
  g.currentDate = txt[0] + ' ' + txt[1].split('.')[0];
  // Compute time spent in the pool
  g.durationInMs = Date.parse(g.currentDate) - Date.parse(g.initialDate);
  g.durationInPool = formatDuration(g.durationInMs); // Human readable format

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
  // Compute hypotheticals
  computeHypo();
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
  }
  if (g.AIDPnL == g.AID2) {
    // Liquidity pairs are always balanced, so total value is simply the double of any one
    g.totalInitialValue = 2 * g.initialAID2Amount;
    g.totalCurrentValue = 2 * g.AID2Total;
  }
  // Compute profit or loss
  g.totalProfit = g.totalCurrentValue - g.totalInitialValue;
  
  // Compute ROI (as ratio)
  g.totalROI = (g.totalCurrentValue / g.totalInitialValue) - 1;

  // Compute estimated APR = ROI * (365 days / duration in days)
  g.totalAPR = (g.durationInMs > 0) ? g.totalROI * (365 * 24 * 60 * 60 * 1000 / g.durationInMs) : 0;

  // Compute price change of the pair
  if (g.AIDPnL == g.AID1) {
    // Change of price of Asset 2 in Asset 1
    const entryPrice = g.initialAID1Amount / g.initialAID2Amount;
    const currentPrice = g.poolAID1Amount / g.poolAID2Amount;
    g.priceChange = (currentPrice / entryPrice) - 1;
  } else {
    // Change of price of Asset 1 in Asset 2
    const entryPrice = g.initialAID2Amount / g.initialAID1Amount;
    const currentPrice = g.poolAID2Amount / g.poolAID1Amount;
    g.priceChange = (currentPrice / entryPrice) - 1;
  }
}

// Compute hypotheticals
function computeHypo() {
  // Only do something if a pool has already been defined
  if (!g.AMML) { return; };
  // Define active unit is not done yet
  if (g.AIDHypo === undefined) { g.AIDHypo = g.AID1; g.AIDHypoName = g.AID1Name; }
  // Compute current worth for the hypothetical scenarios
  if (g.AIDHypo == g.AID1) {
    // Liquidity pairs are always balanced, so total value is simply the double of any one
    g.hypoCurrentValue = 2 * g.AID1Total;
    // Hypothetical worth for each scenario
    g.hypoHodlValue = g.initialAID1Amount + (g.initialAID2Amount * g.poolAID1Amount / g.poolAID2Amount);
    g.hypoA1Value = 2 * g.initialAID1Amount;
    g.hypoA2Value = (2 * g.initialAID2Amount) * (g.poolAID1Amount / g.poolAID2Amount);
  }
  if (g.AIDHypo == g.AID2) {
    // Liquidity pairs are always balanced, so total value is simply the double of any one
    g.hypoCurrentValue = 2 * g.AID2Total;
    // Hypothetical worth for each scenario
    g.hypoHodlValue = (g.initialAID1Amount * g.poolAID2Amount / g.poolAID1Amount) + g.initialAID2Amount;
    g.hypoA1Value = (2 * g.initialAID1Amount) * (g.poolAID2Amount / g.poolAID1Amount);
    g.hypoA2Value = 2 * g.initialAID2Amount;
  }
  // Compare current worth to the hypothetical scenarios
  g.hypoHodlDiff = g.hypoCurrentValue - g.hypoHodlValue;
  g.hypoA1Diff = g.hypoCurrentValue - g.hypoA1Value;
  g.hypoA2Diff = g.hypoCurrentValue - g.hypoA2Value;
}

// Switch the unit of PnL
function invertPnL() {
  // Switch the asset (id and name) used as unit to compute PnL
  [g.AIDPnL, g.AIDPnLName] = (g.AIDPnL == g.AID1) ? [g.AID2, g.AID2Name] : [g.AID1, g.AID1Name];
  // Recompute PnL
  computePnL();
  // Update values and graphs in HTML
  updateDisplay();
}

// Switch the unit of Hypotheticals
function invertHypo() {
  // Switch the asset (id and name) used as unit to compute Hypotheticals
  [g.AIDHypo, g.AIDHypoName] = (g.AIDHypo == g.AID1) ? [g.AID2, g.AID2Name] : [g.AID1, g.AID1Name];
  // Recompute Hypotheticals
  computeHypo();
  // Update values and graphs in HTML
  updateDisplay();
}

// Switch the unit of Analytics
function invertAnalytics() {
  // Switch the asset (id and name) used as unit to compute Analytics
  [g.AIDAnalytics, g.AIDAnalyticsName] = (g.AIDAnalytics == g.AID1) ? [g.AID2, g.AID2Name] : [g.AID1, g.AID1Name];
  // Update values and graphs in HTML
  updateDisplay();
}

// *** SCROLL BUTTONS ***

// When the user scrolls 40px away from top or bottom of the page, show the up or down buttons
function scrollFunction() {
  const myTopButton = document.getElementById('TopButton');
  if (document.body.scrollTop > 40 || document.documentElement.scrollTop > 40) {
    myTopButton.style.display = 'block';
  } else {
    myTopButton.style.display = 'none';
  }
  
  const myBottomButton = document.getElementById('BottomButton');
  //  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 40) {
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
  //window.scrollTo(0, document.body.scrollHeight);
  document.body.scrollTop = Math.abs(document.body.scrollHeight - document.body.clientHeight); // For Safari
  document.documentElement.scrollTop = Math.abs(document.documentElement.scrollHeight - document.documentElement.clientHeight); // For Chrome, Firefox, IE and Opera
}

// *** EXECUTION ***

// Scroll buttons
window.onscroll = function() { scrollFunction() };

// Display default values in the newly loaded page
document.querySelector('.explorerNodeURL').textContent = currentNodeUrl;
updateDisplay();

// Check regularly the node status
document.addEventListener("DOMContentLoaded", () => {
  initNodeSelector();
  setInterval(checkNodeStatus, 30000); // Periodic check every 30 seconds
  
  // Listen to search field changes to update the star icon
  const searchField = document.getElementById('SearchField');
  if (searchField) {
    searchField.addEventListener('input', updateStarState);
    searchField.addEventListener('change', updateStarState);
  }
  
  updateBookmarksDisplay();
  checkURL();
});

// *** BOOKMARKS ***

let favorites = JSON.parse(localStorage.getItem('beam_lp_favorites') || '[]');

function updateStarState() {
  const searchField = document.getElementById('SearchField');
  if (!searchField) return;
  const input = searchField.value.trim();
  // Check if input matches either the saved original search OR the kernel ID
  const isFav = favorites.some(f => f.kernel === input || f.originalSearch === input);
  const favBtn = document.getElementById('FavoriteButton');
  if (favBtn) {
    favBtn.classList.toggle('active', isFav);
  }
}

function updateURL(search) {
  const url = new URL(window.location);
  if (search) {
    url.searchParams.set('search', search);
  } else {
    url.searchParams.delete('search');
  }
  window.history.pushState({}, '', url);
}

function checkURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const search = urlParams.get('search');
  if (search) {
    document.getElementById('SearchField').value = search;
    submitKernelSearch();
  }
}

function toggleFavorite() {
  if (!g.kernel) return;
  const index = favorites.findIndex(f => f.kernel === g.kernel);
  if (index === -1) {
    favorites.push({
      kernel: g.kernel,
      originalSearch: g.originalSearch || g.kernel,
      initialHeight: g.initialHeight,
      aid1: g.AID1Name || 'Asset-A',
      aid2: g.AID2Name || 'Asset-B'
    });
    document.getElementById('FavoriteButton').classList.add('active');
  } else {
    favorites.splice(index, 1);
    document.getElementById('FavoriteButton').classList.remove('active');
  }
  localStorage.setItem('beam_lp_favorites', JSON.stringify(favorites));
  updateBookmarksDisplay();
}

function toggleBookmarks() {
  const container = document.getElementById('BookmarksContainer');
  container.classList.toggle('hidden');
  if (!container.classList.contains('hidden')) {
    updateBookmarksDisplay();
  }
}

function updateBookmarksDisplay() {
  const list = document.getElementById('BookmarksList');
  if (!list) return;
  list.innerHTML = '';
  
  if (favorites.length > 0) {
    favorites.forEach(fav => {
      const title = `${fav.aid1} / ${fav.aid2}`;
      const sub = `Block: ${fav.initialHeight}<br>Kernel: ${fav.kernel.substring(0, 12)}...${fav.kernel.substring(fav.kernel.length - 12)}`;
      const item = createBookmarkItem(fav.originalSearch || fav.kernel, title, sub, fav.kernel);
      list.appendChild(item);
    });
  } else {
    list.innerHTML = '<div class="bookmarkMessage">No bookmarks yet</div>';
  }
}

function createBookmarkItem(search, title, sub, kernel) {
  const div = document.createElement('div');
  div.className = 'bookmarksItem';
  div.onclick = () => {
    document.getElementById('SearchField').value = search;
    submitKernelSearch();
    document.getElementById('BookmarksContainer').classList.add('hidden');
  };
  
  div.innerHTML = `
    <div class="bookmarksItemInfo">
      <span class="bookmarksItemTitle">${title}</span>
      <span class="bookmarksItemSub">${sub}</span>
    </div>
    <button class="bookmarksItemDelete" onclick="event.stopPropagation(); removeFavorite('${kernel}')">&times;</button>
  `;
  return div;
}

function removeFavorite(kernel) {
  favorites = favorites.filter(f => f.kernel !== kernel);
  localStorage.setItem('beam_lp_favorites', JSON.stringify(favorites));
  updateStarState();
  updateBookmarksDisplay();
}

// Close bookmarks when clicking outside
document.addEventListener('click', (e) => {
  const container = document.getElementById('BookmarksContainer');
  const btn = document.getElementById('BookmarksButton');
  if (container && !container.classList.contains('hidden')) {
    // If click is outside container AND outside button
    if (!container.contains(e.target) && !btn.contains(e.target)) {
      container.classList.add('hidden');
    }
  }
});

// *** ANALYTICS ***

function switchTab(tabId) {
  // Initialize analytics unit if not done yet
  if (g.AIDAnalytics === undefined && g.AID1 !== undefined) {
    g.AIDAnalytics = g.AID1;
    g.AIDAnalyticsName = g.AID1Name;
  }

  const activeTab = document.getElementById(tabId);
  if (!activeTab) { return; }
  const activeContent = document.getElementById(tabId + '-content');
  const container = activeTab.closest('.blockUnit');
  // Hide all tabs
  container.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  container.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
  // Display active tab
  activeTab.classList.add('active');
  activeContent.style.display = 'block';

  // Refresh tab content
  if (tabId === 'tab-il') { drawILChart(); }
  else if (tabId === 'tab-scenarios') { drawScenariosChart(); }
  else if (tabId === 'tab-simulator') { drawSimulatorChart(); }
}

function drawILChart() {
  const svg = document.getElementById('il-chart');
  if (!svg || !g.initialAID1Amount || !g.initialAID2Amount || !g.poolAID1Amount || !g.poolAID2Amount) { return; }

  // Graph size
  const width = 400;
  const height = 180;
  const padding = 30; // Padding for labels
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Compute price ratio (= current price / initial price)
  let r, assetOfName, inAssetName;
  if (g.AIDAnalytics === g.AID1) { // Price of Asset 2 in Asset 1
    const initialPrice = g.initialAID1Amount / g.initialAID2Amount;
    const currentPrice = g.poolAID1Amount / g.poolAID2Amount;
    r = currentPrice / initialPrice;
    assetOfName = g.AID2Name;
    inAssetName = g.AID1Name;
  } else { // Price of Asset 1 in Asset 2
    const initialPrice = g.initialAID2Amount / g.initialAID1Amount;
    const currentPrice = g.poolAID2Amount / g.poolAID1Amount;
    r = currentPrice / initialPrice;
    assetOfName = g.AID1Name;
    inAssetName = g.AID2Name;
  }

  // Determine X axis range (max is x5 or x10)
  const maxRatio = (r > 5) ? 10 : 5;
  const minRatio = 0;

  // Compensated IL (= Principal + Fees)
  // Net Result = (Total Current Value / Hodl Value) - 1
  const netResult = (g.hypoCurrentValue / g.hypoHodlValue) - 1;

  // Current Position (Principal IL)
  const currentIL = (2 * Math.sqrt(r) / (1 + r)) - 1;

  // Vertical scale: from -50% to 0% (or +20% if netResult is positive)
  // Go down to -100% only if currentIL is below -50%
  const minVal = (currentIL < -0.5) ? -1.0 : -0.5;
  const maxVal = (netResult > 0) ? 0.2 : 0.0;
  const range = maxVal - minVal;

  // Limit Y values to display range
  const getY = (val) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return padding + ((maxVal - clamped) / range) * chartHeight;
  };

  // IL formula: IL = 2 * sqrt(ratio) / (1 + ratio) - 1
  let points = "";
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    // Compute coordinates
    const ratio = minRatio + (maxRatio - minRatio) * (i / steps);
    const il = (ratio <= 0) ? -1 : (2 * Math.sqrt(ratio) / (1 + ratio)) - 1;
    const x = padding + (i / steps) * chartWidth;
    const y = getY(il);
    // Add point to curve
    points += `${x},${y} `;
  }

  const displayRatio = Math.min(maxRatio, r);
  const dotX = padding + ((displayRatio - minRatio) / (maxRatio - minRatio)) * chartWidth;
  const dotY = getY(currentIL);

  // Compensated IL (Principal + Fees)
  // Net Result = (Total Current Value / Hodl Value) - 1
  const netDotY = getY(netResult);

  // Prepare grid lines
  let gridLines = "";
  // Horizontal grid lines (-100%, -75%, -50% ...)
  const hGridValues = (maxVal > 0) ? [0.2, 0, -0.25, -0.5, -0.75, -1.0] : [0, -0.25, -0.5, -0.75, -1.0];
  hGridValues.forEach(val => {
    if (val < minVal) return;
    const y = getY(val);
    gridLines += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="chart-grid" />`;
    const label = (val > 0 ? "+" : "") + (val * 100) + "%";
    gridLines += `<text x="${padding - 5}" y="${y + 3}" class="chart-label" text-anchor="end">${label}</text>`;
  });
  // Vertical grid lines (x1, x2, x3, x4, x5 ...)
  for (let i = 1; i < maxRatio; i++) {
    const x = padding + ((i - minRatio) / (maxRatio - minRatio)) * chartWidth;
    gridLines += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}" class="chart-grid" />`;
    // Labels on top horizontal line
    gridLines += `<text x="${x}" y="${padding - 8}" class="chart-label" text-anchor="middle">x${i}</text>`;
  }

  // Build SVG graph
  svg.innerHTML = `
    <!-- Grid and Labels -->
    ${gridLines}
    <!-- Axes -->
    <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" class="chart-axis" />
    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" class="chart-axis" />
    <!-- Axis Labels -->
    <text x="${padding}" y="${padding - 8}" class="chart-label" text-anchor="middle">x0</text>
    <text x="${width - padding}" y="${padding - 8}" class="chart-label" text-anchor="middle">x${maxRatio}</text>
    <!-- Axis Titles -->
    <text x="${padding}" y="${height - padding + 15}" class="chart-label chart-label-bold" text-anchor="start">IL</text>
    <text x="${width - padding}" y="${padding - 18}" class="chart-label chart-label-bold" text-anchor="end">Price change of ${assetOfName} in ${inAssetName}</text>
    <!-- Curve -->
    <polyline points="${points}" class="chart-line" />
    <!-- Connector Line -->
    <line x1="${dotX}" y1="${dotY}" x2="${dotX}" y2="${netDotY}" class="chart-connector" />
    <!-- Total Position Dot (with fees): Larger, and drawn first to be behind -->
    <circle cx="${dotX}" cy="${netDotY}" r="6" class="chart-dot-total">
      <title>Position with fees\nPrice change: x${r.toFixed(2)}\nNet Result: ${(netResult * 100).toFixed(2)}%</title>
    </circle>
    <!-- Principal Position Dot (without fees): Smaller, and drawn last to be on top -->
    <circle cx="${dotX}" cy="${dotY}" r="4" class="chart-dot">
      <title>Position without fees\nPrice change: x${r.toFixed(2)}\nIL: ${(currentIL * 100).toFixed(2)}%</title>
    </circle>
  `;

  // Update legend tooltips
  const legendWithoutFees = document.getElementById('legend-without-fees');
  if (legendWithoutFees) {
    legendWithoutFees.title = `Price change: x${r.toFixed(2)}\nIL: ${(currentIL * 100).toFixed(2)}%`;
  }
  const legendWithFees = document.getElementById('legend-with-fees');
  if (legendWithFees) {
    legendWithFees.title = `Price change: x${r.toFixed(2)}\nNet Result: ${(netResult * 100).toFixed(2)}%`;
  }
}

function drawScenariosChart() {
  const svg = document.getElementById('scenarios-chart');
  if (!svg || !g.initialAID1Amount || !g.initialAID2Amount || !g.poolAID1Amount || !g.poolAID2Amount) { return; }

  // Graph size
  const width = 400;
  const height = 180;
  const paddingT = 20; // Top padding for labels
  const paddingB = 30; // Bottom padding for labels
  const paddingL = 20;
  const paddingR = 20;
  const chartWidth = width - paddingL - paddingR;
  const chartHeight = height - paddingT - paddingB;

  // Compute values in the defined unit for this block
  // Remark: Liquidity pairs are always balanced, so total value is simply the double of any one
  let initial, current, hodl, a1, a2, principal, fees;
  if (g.AIDAnalytics === g.AID1) {
    initial = 2 * g.initialAID1Amount;
    current = 2 * g.AID1Total;
    principal = 2 * g.AID1Principal;
    fees = 2 * g.AID1Fees;
    hodl = g.initialAID1Amount + (g.initialAID2Amount * g.poolAID1Amount / g.poolAID2Amount);
    a1 = 2 * g.initialAID1Amount;
    a2 = (2 * g.initialAID2Amount) * (g.poolAID1Amount / g.poolAID2Amount);
  } else {
    initial = 2 * g.initialAID2Amount;
    current = 2 * g.AID2Total;
    principal = 2 * g.AID2Principal;
    fees = 2 * g.AID2Fees;
    hodl = (g.initialAID1Amount * g.poolAID2Amount / g.poolAID1Amount) + g.initialAID2Amount;
    a1 = (2 * g.initialAID1Amount) * (g.poolAID2Amount / g.poolAID1Amount);
    a2 = 2 * g.initialAID2Amount;
  }

  // Define chart content
  const scenarios = [
    { label: 'Initial', value: initial, class: 'bar-initial' },
    { label: 'Current', value: current, class: 'bar-current' },
    { label: 'HODL', value: hodl, class: 'bar-hypo' },
    { label: 'All in ' + g.AID1Name, value: a1, class: 'bar-hypo' },
    { label: 'All in ' + g.AID2Name, value: a2, class: 'bar-hypo' }
  ];

  // Find max value for scaling
  const maxValue = Math.max(...scenarios.map(s => s.value));
  const scale = chartHeight / maxValue;

  // Define all the SVG elements
  let bars = '', labels = '', values = '', defs = '';
  const barWidth = 40;
  const spacing = (chartWidth - (barWidth * scenarios.length)) / (scenarios.length - 1);
  // Vertical bars
  scenarios.forEach((s, i) => {
    const x = paddingL + i * (barWidth + spacing);
    const barHeight = s.value * scale;
    const y = height - paddingB - barHeight;
    const percent = ((s.value / initial) * 100).toFixed(1) + '%';
    const displayValue = displayFormat.totalCurrentValue.format(s.value);
    // Define each bar
    if (s.label === 'Current') {
      const principalPct = ((principal / current) * 100).toFixed(1);
      const feesPct = ((fees / current) * 100).toFixed(1);
      const feesHeight = fees * scale;
      const midY = y + (barHeight + feesHeight) / 2;
      defs += `
        <clipPath id="current-bar-clip">
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="3" />
        </clipPath>
      `;
      bars += `
        <g>
          <title>${principalPct}% principal + ${feesPct}% fees</title>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" class="${s.class}" rx="3" />
          <rect x="${x}" y="${y}" width="${barWidth}" height="${feesHeight}" class="bar-fees" clip-path="url(#current-bar-clip)" />
          <line x1="${x}" y1="${midY}" x2="${x + barWidth}" y2="${midY}" class="bar-split-line" />
        </g>
      `;
    } else {
      bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" class="${s.class}" rx="3" />`;
      if (s.label === 'Initial' || s.label === 'HODL') { // The split line is also displayed on the Initial and HODL bars
        const midY = y + barHeight / 2;
        bars += `<line x1="${x}" y1="${midY}" x2="${x + barWidth}" y2="${midY}" class="bar-split-line" />`;
      }
    }
    // Label below
    labels += `<text x="${x + barWidth / 2}" y="${height - 10}" class="chart-label chart-label-medium" text-anchor="middle">${s.label}</text>`;
    // Value and % above
    values += `
      <text x="${x + barWidth / 2}" y="${y - 15}" class="chart-label chart-label-bold chart-label-medium" text-anchor="middle">${displayValue}</text>
      <text x="${x + barWidth / 2}" y="${y - 5}" class="chart-label chart-label-dim chart-label-small" text-anchor="middle">${percent}</text>
    `;
  });
  // Reference line for the current value
  const currentY = height - paddingB - (current * scale);
  const refLine = `<line x1="${paddingL}" y1="${currentY}" x2="${width - paddingR}" y2="${currentY}" class="chart-ref-line" />`;

  // Assemble the SVG
  svg.innerHTML = `
    <defs>${defs}</defs>
    ${refLine}
    ${bars}
    ${labels}
    ${values}
  `;
}

function drawSimulatorChart() {
  const svg = document.getElementById('simulator-chart');
  if (!svg || !g.initialAID1Amount || !g.initialAID2Amount || !g.poolAID1Amount || !g.poolAID2Amount) { return; }

  // Graph size
  const width = 400;
  const height = 180;
  const paddingT = 20;
  const paddingB = 40;
  const paddingL = 40;
  const paddingR = 20;
  const chartWidth = width - paddingL - paddingR;
  const chartHeight = height - paddingT - paddingB;

  // Get simulator inputs
  const durationMonths = Number(document.getElementById('simulator-duration').value);
  const usageVal = Number(document.getElementById('simulator-fees').value);
  // Replace step 0 of the usage slider with 0.5
  const usageMultiplier = (usageVal === 0) ? 0.5 : usageVal;

  // Compute values in the defined unit for this block
  let currentTotal, initialTotal, currentPrincipal, currentFees, initialA1, initialA2, pInit, pCurr;
  if (g.AIDAnalytics === g.AID1) {
    currentTotal = 2 * g.AID1Total;
    initialTotal = 2 * g.initialAID1Amount;
    currentPrincipal = 2 * g.AID1Principal;
    currentFees = 2 * g.AID1Fees;
    initialA1 = g.initialAID1Amount;
    initialA2 = g.initialAID2Amount;
    pInit = g.initialAID1Amount / g.initialAID2Amount;
    pCurr = g.poolAID1Amount / g.poolAID2Amount;
  } else {
    currentTotal = 2 * g.AID2Total;
    initialTotal = 2 * g.initialAID2Amount;
    currentPrincipal = 2 * g.AID2Principal;
    currentFees = 2 * g.AID2Fees;
    initialA1 = g.initialAID2Amount;
    initialA2 = g.initialAID1Amount;
    pInit = g.initialAID2Amount / g.initialAID1Amount;
    pCurr = g.poolAID2Amount / g.poolAID1Amount;
  }

  // Average daily fee rate based on history
  const avgDailyFees = (g.durationInMs > 0) ? currentFees / (g.durationInMs / (24 * 60 * 60 * 1000)) : 0;
  // Expected fee for the new period
  const projectedDays = durationMonths * 30.42;
  const projectedFees = currentFees + (avgDailyFees * projectedDays * usageMultiplier);

  // Price ratios (x-axis points)
  const ratios = [0.2, 0.25, 0.33, 0.5, 1, 2, 3, 4, 5];
  const labels = ['÷5', '÷4', '÷3', '÷2', 'x1', 'x2', 'x3', 'x4', 'x5'];

  const pointsFuture = [];
  const pointsPrincipal = [];
  //const pointsHodl = [];

  ratios.forEach((r, i) => {
    const x = paddingL + (i / (ratios.length - 1)) * chartWidth;
    const pFuture = r * pCurr;
    // Future Position
    const fPrincipal = currentPrincipal * Math.sqrt(r);
    const fTotal = fPrincipal + projectedFees;
    // Alternative scenarios
    //const valHodl = initialA1 + initialA2 * pFuture;
    // Add points for displayed cases
    pointsFuture.push({x, y: (fTotal / currentTotal) - 1, principal: fPrincipal, fees: projectedFees});
    pointsPrincipal.push({x, y: (fPrincipal / currentTotal) - 1});
    //pointsHodl.push({x, y: (valHodl / currentTotal) - 1});
  });

  // Find Y scale
  const allY = [...pointsFuture, ...pointsPrincipal].map(p => p.y);
  allY.push(0); // Current line
  const minY = Math.min(...allY) - 0.05;
  const maxY = Math.max(...allY) + 0.05;

  // Limit Y values to display range
  const getY = (y) => height - paddingB - ((y - minY) / (maxY - minY)) * chartHeight;

  // Store points and scale (to be used by the floating tooltip)
  g.simPoints = { pointsFuture, getY };

  // Build SVG
  let content = '';

  // Grid and Labels
  const yZero = getY(0);
  const yInitial = getY((initialTotal / currentTotal) - 1);

  // Horizontal grid (percentages)
  const rawRange = maxY - minY;
  let step = 0.1; 
  if (rawRange < 0.25) step = 0.05;
  if (rawRange > 0.6) step = 0.25;
  if (rawRange > 1.2) step = 0.5;
  const gridValues = [0];
  for (let v = step; v <= maxY; v += step) gridValues.push(v);
  for (let v = -step; v >= minY; v -= step) gridValues.push(v);
  gridValues.forEach(val => {
    const y = getY(val);
    content += `<line x1="${paddingL}" y1="${y}" x2="${width - paddingR}" y2="${y}" class="chart-grid" />`;
    const label = (val > 0 ? "+" : "") + (val * 100).toFixed(0) + "%";
    content += `<text x="${paddingL - 5}" y="${y + 3}" class="chart-label" text-anchor="end">${label}</text>`;
  });

  // Vertical grid (price ratios)
  ratios.forEach((r, i) => {
    const x = paddingL + (i / (ratios.length - 1)) * chartWidth;
    const isX1 = (r === 1);
    const gridClass = isX1 ? "chart-grid chart-grid-bold" : "chart-grid";
    content += `<line x1="${x}" y1="${paddingT}" x2="${x}" y2="${height - paddingB}" class="${gridClass}" />`;
    content += `<text x="${x}" y="${height - paddingB + 15}" class="chart-label" text-anchor="middle">${labels[i]}</text>`;
  });

  // Axis Labels
  content += `<text x="${paddingL + 5}" y="${paddingT - 10}" class="chart-label chart-label-bold" text-anchor="start">Next profit in ${g.AIDAnalyticsName}</text>`;
  content += `<text x="${width - paddingR}" y="${height - 5}" class="chart-label chart-label-bold" text-anchor="end">Price change of ${g.AIDAnalytics === g.AID1 ? g.AID2Name : g.AID1Name} in ${g.AIDAnalyticsName}</text>`;

  // Areas for Future Position
  let pathPrincipal = `M ${pointsPrincipal[0].x} ${getY(pointsPrincipal[0].y)}`;
  let pathTotal = `M ${pointsFuture[0].x} ${getY(pointsFuture[0].y)}`;
  for(let i=1; i<pointsPrincipal.length; i++) {
    pathPrincipal += ` L ${pointsPrincipal[i].x} ${getY(pointsPrincipal[i].y)}`;
    pathTotal += ` L ${pointsFuture[i].x} ${getY(pointsFuture[i].y)}`;
  }
  
  // Fill Area for Principal
  const fillPrincipal = pathPrincipal + ` L ${pointsPrincipal[pointsPrincipal.length-1].x} ${height-paddingB} L ${pointsPrincipal[0].x} ${height-paddingB} Z`;
  content += `<path d="${fillPrincipal}" class="chart-area-principal" />`;
  
  // Fill Area for Fees (between Principal and Total)
  let pathFees = pathTotal;
  for(let i=pointsPrincipal.length-1; i>=0; i--) {
    pathFees += ` L ${pointsPrincipal[i].x} ${getY(pointsPrincipal[i].y)}`;
  }
  pathFees += ' Z';
  content += `<path d="${pathFees}" class="chart-area-fees" />`;

  // Chart Lines
  const drawLine = (pts, cls) => {
    let d = `M ${pts[0].x} ${getY(pts[0].y)}`;
    for(let i=1; i<pts.length; i++) d += ` L ${pts[i].x} ${getY(pts[i].y)}`;
    return `<path d="${d}" class="${cls}" />`;
  };

  // HODL line
  //content += drawLine(pointsHodl, 'chart-line-scenario');

  // Initial and Current reference lines
  content += `<line x1="${paddingL}" y1="${yInitial}" x2="${width - paddingR}" y2="${yInitial}" class="chart-line-initial" />`;
  content += `<line x1="${paddingL}" y1="${yZero}" x2="${width - paddingR}" y2="${yZero}" class="chart-line-current" />`;
  
  // Future line
  content += drawLine(pointsFuture, 'chart-line-future');

  // Interactive Overlay (for the floating tooltip)
  content += `<rect x="${paddingL}" y="${paddingT}" width="${chartWidth}" height="${chartHeight}" fill="transparent" onmousemove="showSimulatorTooltip(event)" onmouseleave="hideSimulatorTooltip()" />`;
  content += `<circle id="simulator-dot" r="4" class="chart-dot-total" style="display:none" />`;

  // Display the SVG
  svg.innerHTML = content;

  // Add breakeven info
  const infoDiv = document.getElementById('simulator-info');
  if (currentTotal < initialTotal && avgDailyFees > 0) {
    const loss = initialTotal - currentTotal;
    const days = Math.ceil(loss / avgDailyFees);
    infoDiv.innerHTML = `At current price and with average fees, you will offset the IL in <span class="breakeven-highlight">${days} days</span>.`;
  } else {
    infoDiv.innerHTML = 'Your position is currently profitable compared to initial deposit.';
  }
}

function updateSimulator() {
  // Get slider elements
  const duration = document.getElementById('simulator-duration').value;
  const usageVal = Number(document.getElementById('simulator-fees').value);
  // Replace step 0 of the usage slider with 0.5
  const usage = (usageVal === 0) ? 0.5 : usageVal;
  // Update slider values
  document.getElementById('val-duration').innerText = duration;
  document.getElementById('val-fees').innerText = 'x' + usage.toFixed(1);
  // Refresh chart
  drawSimulatorChart();
}

function showSimulatorTooltip(event) {
  // Check the line exists
  if(!g.simPoints) { return; }

  // Get elements
  const svg = document.getElementById('simulator-chart');
  const dot = document.getElementById('simulator-dot');
  if (!svg || !dot) { return; }

  // Get mouse position
  const rect = svg.getBoundingClientRect();
  const xPos = (event.clientX - rect.left) * (400 / rect.width);

  // X steps
  const paddingL = 40;
  const paddingR = 20;
  const chartWidth = 400 - paddingL - paddingR;
  const ratios = [0.2, 0.25, 0.33, 0.5, 1, 2, 3, 4, 5];
  const labels = ['÷5', '÷4', '÷3', '÷2', 'x1', 'x2', 'x3', 'x4', 'x5'];

  // Find closest step
  let closestIdx = 0;
  let minDist = Infinity;
  for(let i=0; i<ratios.length; i++) {
    const stepX = paddingL + (i / (ratios.length - 1)) * chartWidth;
    const dist = Math.abs(xPos - stepX);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }

  // Draw dot
  const p = g.simPoints.pointsFuture[closestIdx];
  dot.setAttribute('cx', p.x);
  dot.setAttribute('cy', g.simPoints.getY(p.y));
  dot.style.display = 'block';

  // Tooltip content
  const variation = (p.y > 0 ? "+" : "") + (p.y * 100).toFixed(1) + '%';
  const pTotal = p.principal + p.fees;
  const principalPct = (p.principal / pTotal * 100).toFixed(1);
  const feesPct = (p.fees / pTotal * 100).toFixed(1);
  const tooltipText = `Price change in ${g.AIDAnalyticsName}: ${labels[closestIdx]}<br/>Next profit: ${variation}<br/>(${principalPct}% principal + ${feesPct}% fees)`;

  // Show tooltip
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) { return; }
  tooltip.innerHTML = tooltipText;
  tooltip.style.display = 'block';

  // Position tooltip near mouse but not under it (to avoid flicker)
  const x = event.clientX + 15;
  const y = event.clientY + 15;
  // Keep within window bounds
  const rectTT = tooltip.getBoundingClientRect();
  let posX = x;
  let posY = y;
  if (x + rectTT.width > window.innerWidth) { posX = event.clientX - rectTT.width - 15; }
  if (y + rectTT.height > window.innerHeight) { posY = event.clientY - rectTT.height - 15; }
  // Adjust tooltip position
  tooltip.style.left = posX + 'px';
  tooltip.style.top = posY + 'px';
}

function hideSimulatorTooltip() {
  // Hide tooltip and dot
  const tooltip = document.getElementById('tooltip');
  if (tooltip) { tooltip.style.display = 'none'; }
  const dot = document.getElementById('simulator-dot');
  if (dot) { dot.style.display = 'none'; }
}

function resetSimulator() {
  const durationSlider = document.getElementById('simulator-duration');
  const feesSlider = document.getElementById('simulator-fees');
  if (durationSlider && feesSlider) {
    durationSlider.value = 12;
    feesSlider.value = 1;
    updateSimulator();
  }
}
