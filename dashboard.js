document.addEventListener('DOMContentLoaded', () => {
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.pulsechain.com');

  // Contract Addresses (PulseChain-specific where possible)
  const PDAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // PulseChain pDAI (to verify)
  const PMKR_ADDRESS = '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'; // PulseChain pMKR (confirmed working)
  const DOG_ADDRESS = '0x135954d155898D42C90D2A57824C690e0c7BEF1B'; // PulseChain Dog (to verify)
  const VOW_ADDRESS = '0xA950524441892A31ebddF91d3cEEFa04Bf454466'; // PulseChain Vow (to verify)

  // Checksummed Addresses
  const checksumAddresses = {
    pDAI: ethers.utils.getAddress(PDAI_ADDRESS),
    pMKR: ethers.utils.getAddress(PMKR_ADDRESS),
    Dog: ethers.utils.getAddress(DOG_ADDRESS),
    Vow: ethers.utils.getAddress(VOW_ADDRESS)
  };

  // Ilks and Clippers (PulseChain-specific, adjust as needed)
  const ILKS = [
    { name: "ETH-A", clipper: "0xc67963a226eddd77B91aD8c421630A1b0AdFF270" },
    { name: "ETH-B", clipper: "0x71eb894330e8a4b96b8d6056962e7F116F50e06F" },
    { name: "ETH-C", clipper: "0xc2b12567523e3f3CBd9931492b91fe65b240bc47" },
    { name: "WBTC-A", clipper: "0x0227b54AdbFAEec5f1eD1dFa11f54dcff9076e2C" },
    { name: "WBTC-B", clipper: "0xe30663C6f83A06eDeE6273d72274AE24f1084a22" },
    { name: "WBTC-C", clipper: "0x39F29773Dcb94A32529d0612C6706C49622161D1" },
    { name: "BAT-A", clipper: "0x3D22e6f643e2F4c563fD9db22b229Cbb0Cd570fb" },
    { name: "USDC-A", clipper: "0x046b1A5718da6A226D912cFd306BA19980772908" },
    { name: "USDC-B", clipper: "0x5590F23358Fe17361d7E4E4F91219145D8cCfCb3" },
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

  // ABIs (from your provided IPFS link or Ethereum ABIs, assumed compatible)
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

  // Contract Instances with Checksum Verification
  async function verifyAndCreateContract(address, abi, name) {
    try {
      const checksummedAddress = ethers.utils.getAddress(address);
      const code = await provider.getCode(checksummedAddress);
      if (code === '0x') {
        console.error(`${name} contract not deployed at ${checksummedAddress} on PulseChain`);
        return null;
      }
      console.log(`${name} contract verified at ${checksummedAddress}`);
      return new ethers.Contract(checksummedAddress, abi, provider);
    } catch (error) {
      console.error(`Error verifying ${name} at ${address}: ${error.message}`);
      return null;
    }
  }

  // Initialize Contracts
  (async () => {
    const pDai = await verifyAndCreateContract(PDAI_ADDRESS, ERC20_ABI, 'pDAI');
    const pMkr = await verifyAndCreateContract(PMKR_ADDRESS, ERC20_ABI, 'pMKR');
    const dog = await verifyAndCreateContract(DOG_ADDRESS, DOG_ABI, 'Dog');
    const vow = await verifyAndCreateContract(VOW_ADDRESS, VOW_ABI, 'Vow');

    // Supply History Arrays
    let pDaiSupplyHistory = [];
    let pMkrSupplyHistory = [];

    // Initialize with current supply
    if (pDai) {
      try {
        const { totalSupply: initialDai } = await getTokenSupply(pDai);
        pDaiSupplyHistory.push({ timestamp: Date.now(), totalSupply: initialDai });
      } catch (error) {
        console.error('Initial pDAI supply fetch failed:', error);
      }
    }
    if (pMkr) {
      try {
        const { totalSupply: initialMkr } = await getTokenSupply(pMkr);
        pMkrSupplyHistory.push({ timestamp: Date.now(), totalSupply: initialMkr });
      } catch (error) {
        console.error('Initial pMKR supply fetch failed:', error);
      }
    }

    // Record supply every minute
    setInterval(async () => {
      if (pDai) {
        try {
          const { totalSupply: totalSupplyDAI } = await getTokenSupply(pDai);
          pDaiSupplyHistory.push({ timestamp: Date.now(), totalSupply: totalSupplyDAI });
          const oneHourAgo = Date.now() - 3600000;
          pDaiSupplyHistory = pDaiSupplyHistory.filter(entry => entry.timestamp > oneHourAgo);
        } catch (error) {
          console.error('Error recording pDAI supply:', error);
        }
      }
      if (pMkr) {
        try {
          const { totalSupply: totalSupplyMKR } = await getTokenSupply(pMkr);
          pMkrSupplyHistory.push({ timestamp: Date.now(), totalSupply: totalSupplyMKR });
          const oneHourAgo = Date.now() - 3600000;
          pMkrSupplyHistory = pMkrSupplyHistory.filter(entry => entry.timestamp > oneHourAgo);
        } catch (error) {
          console.error('Error recording pMKR supply:', error);
        }
      }
    }, 60000);

    // Update pDAI Supply Display
    async function updatePDaiSupply() {
      if (!pDai) {
        showError('pDaiStatus', 'pDAI contract not available');
        return;
      }
      try {
        const { totalSupply: totalSupplyDAI, totalSupplyWei } = await getTokenSupply(pDai);
        const oneHourAgo = Date.now() - 3600000;
        const pastSupplies = pDaiSupplyHistory.filter(entry => entry.timestamp <= oneHourAgo);
        let changeText = pastSupplies.length > 0
          ? `Change in last hour: ${totalSupplyDAI - pastSupplies[0].totalSupply > 0 ? '+' : ''}${formatNumber(totalSupplyDAI - pastSupplies[0].totalSupply)} pDAI`
          : 'Change in last hour: N/A (insufficient data)';
        document.getElementById('pDaiSupply').innerHTML = `
          <div class="timestamp">${new Date().toLocaleString()}</div>
          <div class="supply">Total Supply: ${formatNumber(totalSupplyDAI)} pDAI</div>
          <div>${changeText}</div>
          <div class="wei">Wei: ${totalSupplyWei.toString()}</div>
        `;
        document.getElementById('pDaiStatus').textContent = '';
      } catch (error) {
        showError('pDaiStatus', error.message);
      }
    }

    // Update pMKR Supply Display
    async function updatePMkrSupply() {
      if (!pMkr) {
        showError('pMkrStatus', 'pMKR contract not available');
        return;
      }
      try {
        const { totalSupply: totalSupplyMKR, totalSupplyWei } = await getTokenSupply(pMkr);
        const oneHourAgo = Date.now() - 3600000;
        const pastSupplies = pMkrSupplyHistory.filter(entry => entry.timestamp <= oneHourAgo);
        let changeText = pastSupplies.length > 0
          ? `Change in last hour: ${totalSupplyMKR - pastSupplies[0].totalSupply > 0 ? '+' : ''}${formatNumber(totalSupplyMKR - pastSupplies[0].totalSupply)} pMKR`
          : 'Change in last hour: N/A (insufficient data)';
        document.getElementById('pMkrSupply').innerHTML = `
          <div class="timestamp">${new Date().toLocaleString()}</div>
          <div class="supply">Total Supply: ${formatNumber(totalSupplyMKR)} pMKR</div>
          <div>${changeText}</div>
          <div class="wei">Wei: ${totalSupplyWei.toString()}</div>
        `;
        document.getElementById('pMkrStatus').textContent = '';
      } catch (error) {
        showError('pMkrStatus', error.message);
      }
    }

    // Start Monitoring Supplies
    setInterval(updatePDaiSupply, 2000);
    setInterval(updatePMkrSupply, 2000);
    updatePDaiSupply();
    updatePMkrSupply();

    // Optimized Auction Monitoring
    async function scanAuctions() {
      if (!dog) {
        showError('auctionsStatus', 'Dog contract not available');
        return;
      }
      async function checkAuctions() {
        try {
          const auctionsList = document.getElementById('currentAuctionsList');
          const status = document.getElementById('auctionsStatus');
          status.innerHTML = `<span class="spinner">⏳</span> Loading auctions...`;
          auctionsList.innerHTML = '';

          const batchSize = 10;
          const maxId = 200;
          const delayBetweenBatches = 100;

          for (let id = 0; id <= maxId; id += batchSize) {
            const batchEnd = Math.min(id + batchSize - 1, maxId);
            const promises = [];

            for (const ilk of ILKS) {
              const clipper = new ethers.Contract(ilk.clipper, CLIPPER_ABI, provider);
              for (let batchId = id; batchId <= batchEnd; batchId++) {
                promises.push(
                  clipper.sales(batchId)
                    .then(([pos, tab, lot, usr, tic, top]) => {
                      if (lot > 0 && tic > 0) {
                        return { id: batchId, ilk: ilk.name, tab, lot, usr, tic, top };
                      }
                      return null;
                    })
                    .catch(() => null)
                );
              }
            }

            const results = await Promise.all(promises);
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

            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
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
      if (!vow) {
        showError('flopStatus', 'Vow contract not available');
        return;
      }
      async function checkFlop() {
        try {
          const flopList = document.getElementById('flopAuctionsList');
          const status = document.getElementById('flopStatus');
          status.innerHTML = `<span class="spinner">⏳</span> Loading Flop auctions...`;
          flopList.innerHTML = '';

          const batchSize = 50;
          const maxId = 200;
          const promises = [];
          for (let id = 0; id <= maxId; id += batchSize) {
            const batchEnd = Math.min(id + batchSize - 1, maxId);
            for (let batchId = id; batchId <= batchEnd; batchId++) {
              promises.push(
                vow.bids(batchId)
                  .then(([bid, lot, guy, tic, end]) => {
                    if (lot > 0 && tic > 0) {
                      return { id: batchId, bid, lot, guy, tic, end };
                    }
                    return null;
                  })
                  .catch(() => null)
              );
            }
          }
          const results = await Promise.all(promises);
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
      if (!vow) {
        showError('statsStatus', 'Vow contract not available');
        return;
      }
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
            li.innerHTML = `<div class="stat-detail">${stat.label}: ${formatNumber(Number(stat.value))} ${stat.unit}</div>`;
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

    // Helper Functions
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

    function showError(statusId, message) {
      document.getElementById(statusId).textContent = `Error: ${message} (retrying...)`;
    }

    // Start Monitoring
    scanAuctions();
    scanFlopAuctions();
    fetchMakerStats();
  })();
});
