document.addEventListener('DOMContentLoaded', () => {
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.pulsechain.com');
  
  // Contract Addresses
  const PDAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
  const PMKR_ADDRESS = '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2';
  const DOG_ADDRESS = '0x135954d155898d42c90d2a57824c690e0c7bef1b';
  const VOW_ADDRESS = '0xA950524441892A31ebddF91d3cEEFa04Bf454466';

  // Ilks and Clippers
  const ILKS = [
    { name: "ETH-A", clipper: "0xc67963a226eddd77B91aD8c421630A1b0AdFF270" },
    { name: "ETH-B", clipper: "0x71eb894330e8a4b96b8d6056962e7F116F50e06F" },
    { name: "ETH-C", clipper: "0xc2b12567523e3f3CBd9931492b91fe65b240bc47" },
    { name: "WBTC-A", clipper: "0x0227b54AdbFAEec5f1eD1dFa11f54dcff9076e2C" },
    { name: "WBTC-B", clipper: "0xe30663C6f83A06eDeE6273d72274AE24f1084a22" },
    { name: "WBTC-C", clipper: "0x39F29773Dcb94A32529d0612C6706C49622161D1" },
    { name: "BAT-A", clipper: "0x3D22e6f643e2F4c563fD9db22b229Cbb0Cd570fb" },
    { name: "USDC-A", clipper: "0x046b1A5718da6A226D912cFd306BA19980772908" },
    { name: "USDC-B", clipper: "0x5590F23358Fe17361d7E4E4f91219145D8cCfCb3" },
    { name: "TUSD-A", clipper: "0x0F6f88f8A4b918584E3539182793a0C276097f44" },
    { name: "KNC-A", clipper: "0x006Aa3eB5E666D8E006aa647D4afAB212555Ddea" },
    { name: "ZRX-A", clipper: "0xdc90d461E148552387f3aB3EBEE0Bdc58Aa16375" },
    { name: "MANA-A", clipper: "0xF5C8176E1eB0915359E46DEd16E52C071Bb435c0" },
    { name: "PAXUSD-A", clipper: "0xBCb396Cd139D1116BD89562B49b9D1d6c25378B0" },
    { name: "COMP-A", clipper: "0x2Bb690931407DCA7ecE84753EA931ffd304f0F38" },
    { name: "LRC-A", clipper: "0x81C5CDf4817DBf75C7F08B8A1cdaB05c9B3f70F7" },
    { name: "LINK-A", clipper: "0x832Dd5f17B30078a5E46Fdb8130A68cBc4a74dC0" },
    { name: "BAL-A", clipper: "0x6AAc067bb903E633A422dE7BE9355E62B3CE0378" },
    { name: "YFI-A", clipper: "0x9daCc11dcD0aa13386D295eAeeBBd38130897E6f" }
  ];

  // ABIs
  const ERC20_ABI = [
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)'
  ];
  const DOG_ABI = [
    'function ilks(bytes32) view returns (address clip, uint256 chop, uint256 hole, uint256 dirt)'
  ];
  const CLIPPER_ABI = [
    'function sales(uint256 id) view returns (uint256 pos, uint256 tab, uint256 lot, address usr, uint96 tic, uint256 top)'
  ];
  const VOW_ABI = [
    'function Awe() view returns (uint256)',
    'function Sin() view returns (uint256)',
    'function Ash() view returns (uint256)',
    'function Woe() view returns (uint256)',
    'function Joy() view returns (uint256)',
    'function sump() view returns (uint256)',
    'function wait() view returns (uint256)',
    'function bids(uint256 id) view returns (uint256 bid, uint256 lot, address guy, uint48 tic, uint48 end)'
  ];

  // Contract Instances
  const pDai = new ethers.Contract(PDAI_ADDRESS, ERC20_ABI, provider);
  const pMkr = new ethers.Contract(PMKR_ADDRESS, ERC20_ABI, provider);
  const dog = new ethers.Contract(DOG_ADDRESS, DOG_ABI, provider);
  const vow = new ethers.Contract(VOW_ADDRESS, VOW_ABI, provider);

  // Supply Monitoring
  let lastPDaiSupply = null;
  let lastPDaiSupplyWei = null;
  let lastPMkrSupply = null;
  let lastPMkrSupplyWei = null;

  function formatNumber(num) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }

  async function getTokenSupply(contract) {
    try {
      const totalSupplyWei = await contract.totalSupply();
      const totalSupply = Number(totalSupplyWei) / 1e18;
      return { totalSupply, totalSupplyWei };
    } catch (error) {
      throw error;
    }
  }

  function addSupplyEntry(listId, { timestamp, totalSupply, totalSupplyWei, change }, token) {
    const supplyList = document.getElementById(listId);
    const li = document.createElement('li');
    li.className = 'supply-entry';
    const changeClass = change > 0 ? 'change-positive' : change < 0 ? 'change-negative' : '';
    const changeText = change !== null ? 
      `Change: ${change > 0 ? '+' : ''}${formatNumber(change)} ${token}` : 
      'Change: Initial value';

    li.innerHTML = `
      <div class="timestamp">${timestamp}</div>
      <div class="supply">Total Supply: ${formatNumber(totalSupply)} ${token}</div>
      <div class="${changeClass}">${changeText}</div>
      <div class="wei">Wei: ${totalSupplyWei.toString()}</div>
    `;
    supplyList.insertBefore(li, supplyList.firstChild);
  }

  function showError(statusId, message) {
    const status = document.getElementById(statusId);
    status.textContent = `Error: ${message} (retrying...)`;
  }

  async function monitorPDaiSupply() {
    async function checkSupply() {
      try {
        const { totalSupply: totalSupplyDAI, totalSupplyWei } = await getTokenSupply(pDai);
        const status = document.getElementById('pDaiStatus');
        status.innerHTML = `<span class="spinner">⏳</span> Checking pDAI supply...`;

        if (lastPDaiSupply === null || Math.abs(totalSupplyDAI - lastPDaiSupply) > 0.0001) {
          const change = lastPDaiSupply !== null ? totalSupplyDAI - lastPDaiSupply : null;
          const timestamp = new Date().toLocaleString();
          addSupplyEntry('pDaiSupplyList', { timestamp, totalSupply: totalSupplyDAI, totalSupplyWei, change }, 'pDAI');
          lastPDaiSupply = totalSupplyDAI;
          lastPDaiSupplyWei = totalSupplyWei;
        }
        setTimeout(checkSupply, 2000);
      } catch (error) {
        showError('pDaiStatus', error.message);
        setTimeout(checkSupply, 5000);
      }
    }
    checkSupply();
  }

  async function monitorPMkrSupply() {
    async function checkSupply() {
      try {
        const { totalSupply: totalSupplyMKR, totalSupplyWei } = await getTokenSupply(pMkr);
        const status = document.getElementById('pMkrStatus');
        status.innerHTML = `<span class="spinner">⏳</span> Checking pMKR supply...`;

        if (lastPMkrSupply === null || Math.abs(totalSupplyMKR - lastPMkrSupply) > 0.0001) {
          const change = lastPMkrSupply !== null ? totalSupplyMKR - lastPMkrSupply : null;
          const timestamp = new Date().toLocaleString();
          addSupplyEntry('pMkrSupplyList', { timestamp, totalSupply: totalSupplyMKR, totalSupplyWei, change }, 'pMKR');
          lastPMkrSupply = totalSupplyMKR;
          lastPMkrSupplyWei = totalSupplyWei;
        }
        setTimeout(checkSupply, 2000);
      } catch (error) {
        showError('pMkrStatus', error.message);
        setTimeout(checkSupply, 5000);
      }
    }
    checkSupply();
  }

  // Auction Monitoring
  async function scanAuctions() {
    async function checkAuctions() {
      try {
        const auctionsList = document.getElementById('currentAuctionsList');
        const status = document.getElementById('auctionsStatus');
        status.innerHTML = `<span class="spinner">⏳</span> Loading auctions...`;
        auctionsList.innerHTML = '';

        const startId = 1;
        const maxId = 200; // Reduced range
        const batchSize = 50;

        for (const ilk of ILKS) {
          try {
            const clipper = new ethers.Contract(ilk.clipper, CLIPPER_ABI, provider);
            for (let batchStart = startId; batchStart <= maxId; batchStart += batchSize) {
              const batchEnd = Math.min(batchStart + batchSize - 1, maxId);
              const batchPromises = [];
              for (let id = batchStart; id <= batchEnd; id++) {
                batchPromises.push(
                  clipper.sales(id)
                    .then(([pos, tab, lot, usr, tic, top]) => {
                      if (lot > 0 && tic > 0) {
                        return { id, ilk: ilk.name, tab, lot, usr, tic, top };
                      }
                      return null;
                    })
                    .catch(() => null)
                );
              }
              const results = await Promise.all(batchPromises);
              results.forEach(result => {
                if (result) {
                  const li = document.createElement('li');
                  li.className = 'auction-entry';
                  li.innerHTML = `
                    <div class="auction-detail">Ilk: ${result.ilk}</div>
                    <div class="auction-detail">ID: ${result.id}</div>
                    <div class="auction-detail">Lot: ${ethers.utils.formatUnits(result.lot, result.ilk.includes("WBTC") ? 8 : result.ilk.includes("USDC") ? 6 : 18)} ${result.ilk.includes("WBTC") ? 'WBTC' : result.ilk.includes("USDC") ? 'USDC' : 'PLS'}</div>
                    <div class="auction-detail">Debt: ${ethers.utils.formatUnits(result.tab, 18)} pDAI</div>
                    <div class="auction-detail">Top Bid: ${ethers.utils.formatUnits(result.top, 18)} pDAI</div>
                    <div class="auction-detail">User: ${result.usr}</div>
                    <div class="auction-detail">Start Time: ${new Date(Number(result.tic) * 1000).toLocaleString()}</div>
                  `;
                  auctionsList.appendChild(li);
                }
              });
              await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay between ilks
          } catch (error) {
            console.error(`Error scanning ${ilk.name}: ${error.message}`);
          }
        }
        status.textContent = 'Auctions loaded.';
        setTimeout(checkAuctions, 30000);
      } catch (error) {
        showError('auctionsStatus', error.message);
        setTimeout(checkAuctions, 5000);
      }
    }
    checkAuctions();
  }

  // Flop Auctions
  async function scanFlopAuctions() {
    async function checkFlop() {
      try {
        const flopList = document.getElementById('flopAuctionsList');
        const status = document.getElementById('flopStatus');
        status.innerHTML = `<span class="spinner">⏳</span> Loading Flop auctions...`;
        flopList.innerHTML = '';

        const startId = 1;
        const maxId = 200; // Reduced range
        const batchSize = 50;
        for (let batchStart = startId; batchStart <= maxId; batchStart += batchSize) {
          const batchEnd = Math.min(batchStart + batchSize - 1, maxId);
          const batchPromises = [];
          for (let id = batchStart; id <= batchEnd; id++) {
            batchPromises.push(
              vow.bids(id)
                .then(([bid, lot, guy, tic, end]) => {
                  if (lot > 0 && tic > 0) {
                    return { id, bid, lot, guy, tic, end };
                  }
                  return null;
                })
                .catch(() => null)
            );
          }
          const results = await Promise.all(batchPromises);
          results.forEach(result => {
            if (result) {
              const li = document.createElement('li');
              li.className = 'auction-entry';
              li.innerHTML = `
                <div class="auction-detail">ID: ${result.id}</div>
                <div class="auction-detail">Bid: ${ethers.utils.formatUnits(result.bid, 18)} pDAI</div>
                <div class="auction-detail">Lot: ${ethers.utils.formatUnits(result.lot, 18)} pMKR</div>
                <div class="auction-detail">User: ${result.guy}</div>
                <div class="auction-detail">Start Time: ${new Date(Number(result.tic) * 1000).toLocaleString()}</div>
                <div class="auction-detail">End Time: ${new Date(Number(result.end) * 1000).toLocaleString()}</div>
              `;
              flopList.appendChild(li);
            }
          });
          await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay
        }
        status.textContent = 'Flop auctions loaded.';
        setTimeout(checkFlop, 30000);
      } catch (error) {
        showError('flopStatus', error.message);
        setTimeout(checkFlop, 5000);
      }
    }
    checkFlop();
  }

  // Maker Stats
  async function fetchMakerStats() {
    async function checkStats() {
      try {
        const statsList = document.getElementById('makerStatsList');
        const status = document.getElementById('statsStatus');
        status.innerHTML = `<span class="spinner">⏳</span> Loading stats...`;
        statsList.innerHTML = '';

        const awe = await vow.Awe();
        const sin = await vow.Sin();
        const ash = await vow.Ash();
        const woe = await vow.Woe();
        const joy = await vow.Joy();
        const sump = await vow.sump();
        const wait = await vow.wait();

        const stats = [
          { label: "Awe (Total Debt)", value: ethers.utils.formatUnits(awe, 18), unit: "pDAI" },
          { label: "Sin (Queued Debt)", value: ethers.utils.formatUnits(sin, 18), unit: "pDAI" },
          { label: "Ash (Auctioned Debt)", value: ethers.utils.formatUnits(ash, 18), unit: "pDAI" },
          { label: "Woe (Bad Debt Ready)", value: ethers.utils.formatUnits(woe, 18), unit: "pDAI" },
          { label: "Joy (Available pDAI)", value: ethers.utils.formatUnits(joy, 18), unit: "pDAI" },
          { label: "Sump (Min Debt Auction)", value: ethers.utils.formatUnits(sump, 18), unit: "pDAI" },
          { label: "Wait Period", value: wait.toString(), unit: "seconds" }
        ];

        stats.forEach(stat => {
          const li = document.createElement('li');
          li.className = 'stats-entry';
          li.innerHTML = `
            <div class="stat-detail">${stat.label}: ${formatNumber(Number(stat.value))} ${stat.unit}</div>
          `;
          statsList.appendChild(li);
        });

        status.textContent = 'Stats loaded.';
        setTimeout(checkStats, 30000);
      } catch (error) {
        showError('statsStatus', error.message);
        setTimeout(checkStats, 5000);
      }
    }
    checkStats();
  }

  // Start Monitoring
  monitorPDaiSupply();
  monitorPMkrSupply();
  fetchMakerStats();
  scanAuctions();
  scanFlopAuctions();
});
