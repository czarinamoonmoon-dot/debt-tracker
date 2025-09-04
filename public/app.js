// Friend Details Page Rendering
if (window.location.pathname.endsWith('friend-details.html')) {
  const friendName = localStorage.getItem('selectedFriend');
  const nameEl = document.getElementById('fd-friend-name');
  const picEl = document.getElementById('fd-friend-pic');
  const currentUser = localStorage.getItem('currentUser');
  let friends = JSON.parse(localStorage.getItem(`friends_${currentUser}`) || '[]');
  let friendObj = friends.find(f => f.name === friendName);
  if (nameEl && friendName) {
    nameEl.textContent = friendName;
  }
  if (picEl && friendObj && friendObj.pic) {
    picEl.src = friendObj.pic;
    picEl.alt = friendName + "'s profile picture";
  } else if (picEl) {
    picEl.src = '';
    picEl.alt = '';
  }
  // Render table (empty for now, can be filled with transactions later)
  const tableBody = document.getElementById('fd-table-body');


    // T-chart data storage (cloud sync for transactions only)
    async function getTChart(friendName) {
      // Fetch all transactions from backend
      const res = await fetch('/api/masterlist');
      const transactions = await res.json();
      // Filter transactions for this friend
      const paid = transactions.filter(tx => tx.from === currentUser && tx.to === friendName)
        .map(tx => ({ date: '', title: '', amount: tx.amount, currency: 'HKD' }));
      const owe = transactions.filter(tx => tx.from === friendName && tx.to === currentUser)
        .map(tx => ({ date: '', title: '', amount: tx.amount, currency: 'HKD' }));
      return { paid, owe };
    }

    async function addTransaction(type, friendName, amount) {
      // type: 'paid' means currentUser paid friend; 'owe' means friend paid currentUser
      let from, to;
      if (type === 'paid') {
        from = currentUser;
        to = friendName;
      } else {
        from = friendName;
        to = currentUser;
      }
      await fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, amount: parseFloat(amount) })
      });
    }

  async function renderTChart(friendName) {
    const tableBody = document.getElementById('fd-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
      getTChart(friendName).then(chart => {
        const paidRows = chart.paid;
        const oweRows = chart.owe;
        const maxRows = Math.max(paidRows.length, oweRows.length);
        let friends = JSON.parse(localStorage.getItem('friends') || '[]');
        let friendObj = friends.find(f => f.name === friendName);
        let defaultCurrency = (friendObj && friendObj.currency) ? friendObj.currency : 'HKD';
        for (let i = 0; i < maxRows; i++) {
          const tr = document.createElement('tr');
          const rates = { HKD: 1, USD: 7.8, CNY: 1.08, EUR: 8.5, JPY: 0.054, GBP: 9.9, KRW: 0.006, AUD: 5.1, CAD: 5.7 };
          const paid = paidRows[i] || { date: '', title: '', amount: '', currency: defaultCurrency };
          tr.appendChild(createCell(paid.date));
          tr.appendChild(createCell(paid.title));
          let paidAmtHKD = parseFloat(paid.amount) || 0;
          let paidAmtDisplay = '';
          if (paidAmtHKD && defaultCurrency !== 'HKD') {
            paidAmtDisplay = (paidAmtHKD / rates[defaultCurrency]).toFixed(2) + ' ' + defaultCurrency;
          } else if (paidAmtHKD) {
            paidAmtDisplay = paidAmtHKD.toFixed(2);
          }
          tr.appendChild(createCell(paidAmtDisplay));
          const owe = oweRows[i] || { date: '', title: '', amount: '', currency: defaultCurrency };
          tr.appendChild(createCell(owe.date));
          tr.appendChild(createCell(owe.title));
          let oweAmtHKD = parseFloat(owe.amount) || 0;
          let oweAmtDisplay = '';
          if (oweAmtHKD && defaultCurrency !== 'HKD') {
            oweAmtDisplay = (oweAmtHKD / rates[defaultCurrency]).toFixed(2) + ' ' + defaultCurrency;
          } else if (oweAmtHKD) {
            oweAmtDisplay = oweAmtHKD.toFixed(2);
          }
          tr.appendChild(createCell(oweAmtDisplay));
          tableBody.appendChild(tr);
        }
        // ...summary logic unchanged...
      });

    // Edit popup logic
    window.openEditPopup = function(type, idx, row) {
  popupType = type;
  popupTitle.textContent = `Edit Row in ${type === 'paid' ? 'I paid' : 'I owe bro'}`;
  popupDate.value = row.date || '';
  popupTitleInput.value = row.title || '';
  popupAmount.value = row.amount || '';
  const currencySelect = document.getElementById('popup-currency');
  if (currencySelect) currencySelect.value = row.currency || 'HKD';
  popup.style.display = 'flex';
      // Save handler for editing (replace row)
      popupSave.onclick = async function() {
        const currencySelect = document.getElementById('popup-currency');
        let inputCurrency = 'HKD';
        if (currencySelect) inputCurrency = currencySelect.value;
        let friends = JSON.parse(localStorage.getItem('friends') || '[]');
        let friendObj = friends.find(f => f.name === friendName);
        let defaultCurrency = (friendObj && friendObj.currency) ? friendObj.currency : 'HKD';
        // Conversion rates
        const rates = { HKD: 1, USD: 7.8, CNY: 1.08, EUR: 8.5, JPY: 0.054, GBP: 9.9, KRW: 0.006, AUD: 5.1, CAD: 5.7 };
        // Convert input amount to HKD first
        let amountHKD = (parseFloat(popupAmount.value) || 0) * (rates[inputCurrency] || 1);
        // Then convert HKD to friend's default currency
        let amountDefault = amountHKD / (rates[defaultCurrency] || 1);
        await addTransaction(popupType, friendName, amountDefault.toFixed(2));
        await renderTChart(friendName);
        hidePopup();
      };
      // Delete handler with confirm modal
      const popupDelete = document.getElementById('popup-delete');
      const confirmModal = document.getElementById('confirm-row-delete-modal');
      const confirmBtn = document.getElementById('confirm-row-delete-btn');
      const cancelBtn = document.getElementById('cancel-row-delete-btn');
      if (popupDelete && confirmModal && confirmBtn && cancelBtn) {
        popupDelete.onclick = function() {
          confirmModal.style.display = 'flex';
          popup.style.display = 'none';
          // Confirm actual delete
          confirmBtn.onclick = function() {
            const chart = getTChart(friendName);
            chart[type].splice(idx, 1);
            setTChart(friendName, chart);
            renderTChart(friendName);
            confirmModal.style.display = 'none';
          };
          // Cancel delete
          cancelBtn.onclick = function() {
            confirmModal.style.display = 'none';
            popup.style.display = 'flex';
          };
        };
      }
    };
    // Calculate summary
    const paidTotal = paidRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const oweTotal = oweRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const summaryEl = document.getElementById('tchart-summary');
    if (summaryEl) {
      summaryEl.style.fontWeight = 'bold';
      summaryEl.style.fontSize = '1.5em';
      let currency = (friendObj && friendObj.currency) ? friendObj.currency : 'HKD';
      if (paidTotal === 0 && oweTotal === 0) {
        summaryEl.textContent = 'ALL CLEAR 🙆‍♂️';
        summaryEl.style.color = '#222';
      } else if (paidTotal > oweTotal) {
        let amt = (paidTotal - oweTotal).toFixed(2);
        summaryEl.textContent = currency === 'HKD' ? `BRO OWES ME: $${amt}` : `BRO OWES ME: $${amt} ${currency}`;
        summaryEl.style.color = '#22c55e'; // green
      } else if (oweTotal > paidTotal) {
        let amt = (oweTotal - paidTotal).toFixed(2);
        summaryEl.textContent = currency === 'HKD' ? `I OWE BRO: $${amt}` : `I OWE BRO: $${amt} ${currency}`;
        summaryEl.style.color = '#ef4444'; // red
      } else {
        summaryEl.textContent = 'ALL CLEAR 🙆‍♂️';
        summaryEl.style.color = '#222';
      }
    }
  }
  function createCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
  }

  // Popup logic for adding row
  let popupType = null;
  const popup = document.getElementById('tchart-popup');
  const popupTitle = document.getElementById('popup-title');
  const popupDate = document.getElementById('popup-date');
  const popupTitleInput = document.getElementById('popup-title-input');
  const popupAmount = document.getElementById('popup-amount');
  const popupSave = document.getElementById('popup-save');
  const popupCancel = document.getElementById('popup-cancel');

  function showPopup(type) {
  popupType = type;
  popupTitle.textContent = `Add Row to ${type === 'paid' ? 'I paid' : 'I owe bro'}`;
  popupDate.value = '';
  popupTitleInput.value = '';
  popupAmount.value = '';
  const currencySelect = document.getElementById('popup-currency');
  let friends = JSON.parse(localStorage.getItem('friends') || '[]');
  let friendObj = friends.find(f => f.name === friendName);
  let defaultCurrency = (friendObj && friendObj.currency) ? friendObj.currency : 'HKD';
  if (currencySelect) currencySelect.value = defaultCurrency;
  popup.style.display = 'flex';
  }
  function hidePopup() {
    popup.style.display = 'none';
  }
  if (popupSave) {
    popupSave.onclick = function() {
      const chart = getTChart(friendName);
      const currencySelect = document.getElementById('popup-currency');
      let currency = 'HKD';
      if (currencySelect) currency = currencySelect.value;
      let inputCurrency = 'HKD';
      if (currencySelect) inputCurrency = currencySelect.value;
      let friends = JSON.parse(localStorage.getItem('friends') || '[]');
      let friendObj = friends.find(f => f.name === friendName);
      let defaultCurrency = (friendObj && friendObj.currency) ? friendObj.currency : 'HKD';
      // Conversion rates
      const rates = { HKD: 1, USD: 7.8, CNY: 1.08, EUR: 8.5, JPY: 0.054, GBP: 9.9, KRW: 0.006, AUD: 5.1, CAD: 5.7 };
      // Convert input amount to HKD first
      let amountHKD = (parseFloat(popupAmount.value) || 0) * (rates[inputCurrency] || 1);
      // Then convert HKD to friend's default currency
      let amountDefault = amountHKD / (rates[defaultCurrency] || 1);
      chart[popupType].push({
        date: popupDate.value,
        title: popupTitleInput.value,
        amount: amountDefault.toFixed(2),
        currency: defaultCurrency
      });
      setTChart(friendName, chart);
      renderTChart(friendName);
      hidePopup();
    };
  }
  if (popupCancel) {
    popupCancel.onclick = hidePopup;
  }

  // Attach button listeners
  document.addEventListener('DOMContentLoaded', () => {
    const addPaid = document.getElementById('add-paid');
    const addOwe = document.getElementById('add-owe');
    if (addPaid) addPaid.onclick = () => showPopup('paid');
    if (addOwe) addOwe.onclick = () => showPopup('owe');
  });

  renderTChart(friendName);
}
  // Background image editing
  const heroBg = document.querySelector('.hero-bg');
  const bgUpload = document.getElementById('bg-upload');
  const editBgBtn = document.getElementById('edit-bg-btn');
  if (editBgBtn) {
    editBgBtn.addEventListener('click', () => bgUpload.click());
    bgUpload.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          heroBg.style.backgroundImage = `url('${evt.target.result}')`;
          localStorage.setItem('customBg', evt.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
    // Load saved background
    const savedBg = localStorage.getItem('customBg');
    if (savedBg) heroBg.style.backgroundImage = `url('${savedBg}')`;
  }
document.addEventListener('DOMContentLoaded', () => {
  // Profile picture editing
  const profilePic = document.getElementById('profile-pic');
  const profileUpload = document.getElementById('profile-upload');
  const editProfileBtn = document.getElementById('edit-profile-btn');
  const currentUser = localStorage.getItem('currentUser');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => profileUpload.click());
    profileUpload.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          profilePic.src = evt.target.result;
          // Save to per-user localStorage
          localStorage.setItem(`profilePic_${currentUser}`, evt.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
    // Load saved profile pic for current user
    const savedPic = localStorage.getItem(`profilePic_${currentUser}`);
    if (savedPic) profilePic.src = savedPic;
  }

  // Recent friends list (show 3 most recent transaction friends, or random 3 from last split bill)
  const recentFriendsList = document.getElementById('recent-friends-list');
  if (recentFriendsList) {
    let friends = JSON.parse(localStorage.getItem(`friends_${currentUser}`) || '[]');
    let charts = JSON.parse(localStorage.getItem(`tcharts_${currentUser}`) || '{}');
    // Find last updated timestamp for each friend
    let friendUpdates = friends.map(friend => {
      let chart = charts[friend.name] || { paid: [], owe: [] };
      let allRows = [...(chart.paid || []), ...(chart.owe || [])];
      let dates = allRows.map(row => new Date(row.date).getTime() || 0);
      let lastUpdate = dates.length ? Math.max(...dates) : 0;
      return { name: friend.name, pic: friend.pic, lastUpdate };
    });
    // Sort by lastUpdate descending
    friendUpdates.sort((a, b) => b.lastUpdate - a.lastUpdate);
    // Check if recentFriends exists (from split bill)
    let recentFriends = JSON.parse(localStorage.getItem('recentFriends') || '[]');
    let recent = [];
    if (recentFriends.length > 3) {
      // Randomly pick 3 from recentFriends
      let shuffled = recentFriends.sort(() => Math.random() - 0.5);
      recent = shuffled.slice(0, 3).map(name => friends.find(f => f.name === name)).filter(Boolean);
    } else if (recentFriends.length > 0) {
      recent = recentFriends.map(name => friends.find(f => f.name === name)).filter(Boolean);
    } else {
      // Fallback: 3 most recent transaction friends
      recent = friendUpdates.slice(0, 3);
    }
    recentFriendsList.innerHTML = '';
    recent.forEach(friend => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '1em';
      row.style.cursor = 'pointer';
      row.style.marginBottom = '1em';
      row.onclick = () => {
        localStorage.setItem('selectedFriend', friend.name);
  window.location.href = 'friend-details.html';
      };
      const img = document.createElement('img');
      img.src = friend.pic;
      img.alt = friend.name;
      img.style.width = '40px';
      img.style.height = '40px';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      const name = document.createElement('span');
      name.textContent = friend.name;
      name.style.display = 'inline-block';
      name.style.verticalAlign = 'middle';
      name.style.fontSize = '1.1em';
      name.style.fontWeight = 'bold';
      row.appendChild(img);
      row.appendChild(name);
      recentFriendsList.appendChild(row);
    });
  }

  // All friends masterlist page
  const allFriendsList = document.getElementById('all-friends-list');
  const addFriendForm = document.getElementById('add-friend-form');
  if (allFriendsList) {
    // Load friends from localStorage and render as boxes
    function renderFriends(filter = '') {
      let friends = JSON.parse(localStorage.getItem(`friends_${currentUser}`) || '[]');
      allFriendsList.innerHTML = '';
      // Get filter value
      const filterSelect = document.getElementById('friend-filter');
      const filterType = filterSelect ? filterSelect.value : 'all';
      // Sort and filter friends
  let charts = JSON.parse(localStorage.getItem(`tcharts_${currentUser}`) || '{}');
      let sortedFriends = friends
        .filter(friend => friend.name.toLowerCase().includes(filter.toLowerCase()))
        .map(friend => {
          let chart = charts[friend.name] || { paid: [], owe: [] };
          const paidTotal = (chart.paid || []).reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
          const oweTotal = (chart.owe || []).reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
          let net = paidTotal - oweTotal;
          let status = 'all';
          if (paidTotal === oweTotal) status = 'clear';
          else if (paidTotal > oweTotal) status = 'owed';
          else if (oweTotal > paidTotal) status = 'owe';
          return { friend, paidTotal, oweTotal, net, status };
        })
        .filter(f => filterType === 'all' || f.status === filterType)
        .sort((a, b) => {
          // Friends with nonzero net (owe/owed) come first
          const aHasDebt = a.net !== 0;
          const bHasDebt = b.net !== 0;
          if (aHasDebt && !bHasDebt) return -1;
          if (!aHasDebt && bHasDebt) return 1;
          return 0;
        });
      sortedFriends.forEach(({ friend, paidTotal, oweTotal, net }) => {
        const box = document.createElement('div');
        box.className = 'afm-friend-box';
        const img = document.createElement('img');
        img.className = 'afm-friend-pic';
        img.src = friend.pic;
        img.alt = friend.name;
        const name = document.createElement('span');
        name.className = 'afm-friend-name';
        name.textContent = friend.name;
        // Summary
        const summary = document.createElement('span');
        summary.style.marginLeft = 'auto';
        summary.style.fontWeight = 'bold';
        summary.style.fontSize = '1.1em';
        let currency = friend.currency || 'HKD';
        const supported = ['HKD','USD','CNY','EUR','JPY','GBP','KRW','AUD','CAD'];
        if (!supported.includes(currency)) currency = 'HKD';
        if (paidTotal === 0 && oweTotal === 0) {
          summary.textContent = '👍';
          summary.style.color = '';
        } else if (paidTotal > oweTotal) {
          let amt = (paidTotal - oweTotal).toFixed(2);
          summary.textContent = currency === 'HKD' ? `${amt}` : `${amt} ${currency}`;
          summary.style.color = '#4ade80'; // light green
        } else if (oweTotal > paidTotal) {
          let amt = (oweTotal - paidTotal).toFixed(2);
          summary.textContent = currency === 'HKD' ? `${amt}` : `${amt} ${currency}`;
          summary.style.color = 'red';
        } else {
          summary.textContent = '👍';
          summary.style.color = '';
        }
        box.appendChild(img);
        box.appendChild(name);
        box.appendChild(summary);
        // Add edit button (grey pen icon)
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17v-2.5l10.06-10.06a1.75 1.75 0 0 1 2.48 0l1.02 1.02a1.75 1.75 0 0 1 0 2.48L6.5 18H4a1 1 0 0 1-1-1Zm13.06-12.06a2.75 2.75 0 0 0-3.88 0L3 14.12V17a2 2 0 0 0 2 2h2.88l10.18-10.18a2.75 2.75 0 0 0 0-3.88l-1.02-1.02Z" fill="#888"/></svg>';
        editBtn.title = 'Edit Friend';
        editBtn.style.background = 'none';
        editBtn.style.border = 'none';
        editBtn.style.cursor = 'pointer';
        editBtn.style.marginLeft = '0.5em';
        editBtn.style.padding = '0';
        editBtn.style.display = 'flex';
        editBtn.style.alignItems = 'center';
        editBtn.onclick = (e) => {
          e.stopPropagation();
          openEditFriendModal(friend);
        };
        box.appendChild(editBtn);
        box.style.display = 'flex';
        box.style.alignItems = 'center';
        box.style.gap = '1em';
        box.addEventListener('click', () => {
          localStorage.setItem('selectedFriend', friend.name);
          window.location.href = 'friend-details.html';
        });
        allFriendsList.appendChild(box);
// Edit Friend Modal logic
function openEditFriendModal(friend) {
  // Set currency dropdown
  const currencySelect = document.getElementById('edit-friend-currency');
  if (currencySelect) {
    currencySelect.value = friend.currency || 'HKD';
    currencySelect.onchange = function() {
      let friends = JSON.parse(localStorage.getItem(`friends_${currentUser}`) || '[]');
      let idx = friends.findIndex(f => f.name === friend.name);
      if (idx !== -1) {
        const oldCurrency = friends[idx].currency || 'HKD';
        const newCurrency = currencySelect.value;
        friends[idx].currency = newCurrency;
        localStorage.setItem(`friends_${currentUser}`, JSON.stringify(friends));
        // Convert all transaction records to the new currency
        if (oldCurrency !== newCurrency) {
          let tcharts = JSON.parse(localStorage.getItem(`tcharts_${currentUser}`) || '{}');
          const rates = { HKD: 1, USD: 7.8, CNY: 1.08, EUR: 8.5, JPY: 0.054, GBP: 9.9, KRW: 0.006, AUD: 5.1, CAD: 5.7 };
          let chart = tcharts[friend.name] || { paid: [], owe: [] };
          ['paid', 'owe'].forEach(type => {
            chart[type] = chart[type].map(row => {
              let amt = parseFloat(row.amount) || 0;
              // Convert from oldCurrency to HKD, then HKD to newCurrency
              if (oldCurrency !== 'HKD') {
                amt = amt * rates[oldCurrency];
              }
              if (newCurrency !== 'HKD') {
                amt = amt / rates[newCurrency];
              }
              return { ...row, amount: amt.toFixed(2), currency: newCurrency };
            });
          });
          tcharts[friend.name] = chart;
          localStorage.setItem(`tcharts_${currentUser}`, JSON.stringify(tcharts));
        }
        renderFriends();
        // Optionally re-render T-chart if on details page
        if (typeof renderTChart === 'function') renderTChart(friend.name);
      }
    };
  }
  const modal = document.getElementById('edit-friend-modal');
  const nameInput = document.getElementById('edit-friend-name');
  const picInput = document.getElementById('edit-friend-pic-upload');
  const picPreview = document.getElementById('edit-friend-pic-preview');
  const cropperModal = document.getElementById('edit-friend-cropper-modal');
  const cropperImg = document.getElementById('edit-friend-cropper-img');
  const cropConfirm = document.getElementById('edit-friend-crop-confirm');
  const cropCancel = document.getElementById('edit-friend-crop-cancel');
  let cropper = null;
  const saveBtn = document.getElementById('edit-friend-save');
  const deleteBtn = document.getElementById('edit-friend-delete');
  const cancelBtn = document.getElementById('edit-friend-cancel');
  const confirmModal = document.getElementById('confirm-delete-modal');
  const confirmBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  if (!modal || !nameInput || !picInput || !picPreview || !saveBtn || !deleteBtn || !cancelBtn || !confirmModal || !confirmBtn || !cancelDeleteBtn) return;
  nameInput.value = friend.name;
  if (friend.pic) {
    picPreview.src = friend.pic;
    picPreview.style.display = '';
  } else {
    picPreview.src = '';
    picPreview.style.display = 'none';
  }
  // Crop current profile pic (can crop repeatedly)
  picPreview.onclick = function() {
    cropperImg.src = picPreview.src;
    cropperModal.style.display = 'flex';
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    cropper = new window.Cropper(cropperImg, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      background: false
    });
  };
  modal.style.display = 'flex';
  // Handle profile pic preview
  picInput.value = '';
  picInput.onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        cropperImg.onload = function() {
          cropperModal.style.display = 'flex';
          if (cropper) {
            cropper.destroy();
            cropper = null;
          }
          cropper = new window.Cropper(cropperImg, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1,
            background: false
          });
        };
        cropperImg.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  // Cropper modal logic
  if (cropConfirm) {
    cropConfirm.onclick = function() {
      if (cropper) {
        // Use original image resolution for cropping
        const naturalWidth = cropperImg.naturalWidth;
        const naturalHeight = cropperImg.naturalHeight;
        const croppedDataUrl = cropper.getCroppedCanvas({ width: naturalWidth, height: naturalHeight }).toDataURL();
        picPreview.src = croppedDataUrl;
        picPreview.style.display = '';
        cropper.destroy();
        cropper = null;
        cropperModal.style.display = 'none';
      }
    };
  }
  if (cropCancel) {
    cropCancel.onclick = function() {
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
      cropperModal.style.display = 'none';
    };
  }
  // Save handler
  saveBtn.onclick = function() {
    let friends = JSON.parse(localStorage.getItem('friends') || '[]');
    let idx = friends.findIndex(f => f.name === friend.name);
    const newName = nameInput.value.trim();
    if (idx !== -1) {
      // Only update transaction records if name changes
      if (friends[idx].name !== newName) {
        // Update transaction records (tcharts)
        let tcharts = JSON.parse(localStorage.getItem('tcharts') || '{}');
        if (tcharts[friend.name]) {
          tcharts[newName] = tcharts[friend.name];
          delete tcharts[friend.name];
          localStorage.setItem('tcharts', JSON.stringify(tcharts));
        }
        // If selectedFriend is the old name, update it
        if (localStorage.getItem('selectedFriend') === friend.name) {
          localStorage.setItem('selectedFriend', newName);
        }
      }
      // Update name and/or pic
      friends[idx].name = newName;
      if (picPreview.src && picPreview.style.display !== 'none') {
        friends[idx].pic = picPreview.src;
      }
  localStorage.setItem(`friends_${currentUser}`, JSON.stringify(friends));
      renderFriends();
      modal.style.display = 'none';
    }
  };
  // Delete handler (show confirm modal)
  deleteBtn.onclick = function() {
    confirmModal.style.display = 'flex';
    modal.style.display = 'none';
    // Confirm actual delete
    confirmBtn.onclick = function() {
  let friends = JSON.parse(localStorage.getItem(`friends_${currentUser}`) || '[]');
      let idx = friends.findIndex(f => f.name === friend.name);
      if (idx !== -1) {
        friends.splice(idx, 1);
    localStorage.setItem(`friends_${currentUser}`, JSON.stringify(friends));
        renderFriends();
        confirmModal.style.display = 'none';
      }
    };
    // Cancel delete
    cancelDeleteBtn.onclick = function() {
      confirmModal.style.display = 'none';
      modal.style.display = 'flex';
    };
  };
  // Cancel handler
  cancelBtn.onclick = function() {
    modal.style.display = 'none';
  };
}
      });
    }
    renderFriends();

    // Search bar functionality
    const friendSearch = document.getElementById('friend-search');
    const friendFilter = document.getElementById('friend-filter');
    if (friendSearch) {
      friendSearch.addEventListener('input', e => {
        renderFriends(friendSearch.value);
      });
    }
    if (friendFilter) {
      friendFilter.addEventListener('change', () => {
        renderFriends(friendSearch ? friendSearch.value : '');
      });
    }

    let cropper;
    const cropModal = document.getElementById('crop-modal');
    const cropImage = document.getElementById('crop-image');
    const cropConfirm = document.getElementById('crop-confirm');
    const cropCancel = document.getElementById('crop-cancel');
    let pendingFriendName = '';
    let pendingFile = null;

    if (addFriendForm) {
      addFriendForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('friend-name').value.trim();
        const picInput = document.getElementById('friend-pic-upload');
        const file = picInput.files[0];
        if (!name || !file) return;
        pendingFriendName = name;
        pendingFile = file;
        const reader = new FileReader();
        reader.onload = function(evt) {
          cropImage.src = evt.target.result;
          cropModal.style.display = 'flex';
          cropper = new window.Cropper(cropImage, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1,
            background: false
          });
        };
        reader.readAsDataURL(file);
      });
    }

    if (cropConfirm) {
      cropConfirm.addEventListener('click', () => {
        if (cropper) {
          const croppedDataUrl = cropper.getCroppedCanvas({ width: 120, height: 120 }).toDataURL();
          let friends = JSON.parse(localStorage.getItem(`friends_${currentUser}`) || '[]');
          friends.push({ name: pendingFriendName, pic: croppedDataUrl });
          localStorage.setItem(`friends_${currentUser}`, JSON.stringify(friends));
          addFriendForm.reset();
          cropper.destroy();
          cropper = null;
          cropModal.style.display = 'none';
            renderFriends();
        }
      });
    }
    if (cropCancel) {
      cropCancel.addEventListener('click', () => {
        if (cropper) {
          cropper.destroy();
          cropper = null;
        }
        cropModal.style.display = 'none';
          renderFriends(); // Always refresh masterlist when modal closes
      });
    }
  }
});
