
// Smooth scrolling

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", function(e){

        e.preventDefault();

        document.querySelector(this.getAttribute("href"))
        .scrollIntoView({

            behavior:"smooth"

        });

    });

});



// Scroll animation

const cards = document.querySelectorAll(".card, .box");


window.addEventListener("scroll", ()=>{


cards.forEach(card=>{


let position = card.getBoundingClientRect().top;


if(position < window.innerHeight - 100){

card.style.opacity="1";
card.style.transform="translateY(0)";


}


});


});



// Initial animation

cards.forEach(card=>{

card.style.opacity="0";
card.style.transform="translateY(40px)";
card.style.transition="0.6s";

});

// Form Submission Alert
const form = document.getElementById('consultation-form');
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Aapki jankari safaltapoorvak bhej di gayi hai. Hum shighra hi aapko sampark karenge.');
    form.reset();
  });
}

// Smooth Scroll
document.documentElement.style.scrollBehavior = 'smooth';

// ==========================================
// 1. Scroll Reveal Animation Setup
// ==========================================
if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 1000,
    once: true
  });
}

// ==========================================
// 2. Daily Suvichar Script
// ==========================================
const suvichars = [
  { thought: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।", meaning: "कर्म करते रहो, फल की चिंता मत करो। आपका कर्तव्य ही आपकी शक्ति है।" },
  { thought: "सत्यमेव जयते नानृतम्।", meaning: "सत्य की ही सदा विजय होती है, असत्य की नहीं।" },
  { thought: "अहिंसा परमो धर्मः।", meaning: "अहिंसा और दया ही मानव जीवन का सबसे बड़ा धर्म है।" },
  { thought: "विद्या ददाति विनयं।", meaning: "सच्ची विद्या मनुष्य को विनम्र और श्रेष्ठ बनाती है।" },
  { thought: "योगः कर्मसु कौशलम्।", meaning: "अपने कार्य को कुशलता और ईमानदारी से करना ही योग है।" },
  { thought: "उद्यमेन हि सिध्यन्ति कार्याणि न मनोरथैः।", meaning: "कार्यों की सिद्धि केवल परिश्रम से होती है, सिर्फ इच्छा करने से नहीं।" },
  { thought: "वसुधैव कुटुम्बकम्।", meaning: "संपूर्ण पृथ्वी ही हमारा एक परिवार है, सभी के प्रति प्रेम रखें।" }
];

const today = new Date().getDate();
const index = today % suvichars.length;

const thoughtEl = document.getElementById('daily-thought');
const meaningEl = document.getElementById('thought-meaning');

if (thoughtEl && meaningEl) {
  thoughtEl.innerText = `"${suvichars[index].thought}"`;
  meaningEl.innerText = `— ${suvichars[index].meaning}`;
}



// Live Google Drive PDF library (JSONP avoids cross-origin fetch restrictions)
(function loadDrivePdfLibrary() {
  const status = document.getElementById('drive-pdf-status');
  const list = document.getElementById('drive-pdf-list');
  if (!status || !list) return;

  window.handleDrivePdfLibrary = function(data) {
    list.replaceChildren();
    if (!data || data.success !== true || !Array.isArray(data.files)) {
      status.textContent = 'PDF सूची अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद पुनः प्रयास करें।';
      return;
    }
    if (data.files.length === 0) {
      status.textContent = 'इस Drive फ़ोल्डर में अभी कोई PDF नहीं मिली।';
      return;
    }
    status.textContent = 'कुल ' + data.files.length + ' PDF उपलब्ध हैं।';
    data.files.forEach(function(file) {
      if (!file || !file.id) return;
      const item = document.createElement('article');
      item.className = 'drive-pdf-item';
      const title = document.createElement('h4');
      title.textContent = file.name || 'बिना नाम की PDF';
      const actions = document.createElement('div');
      actions.className = 'drive-pdf-actions';
      const read = document.createElement('a');
      const bookUrl = new URL('pdf.html', window.location.href);
      bookUrl.searchParams.set('id', file.id);
      bookUrl.searchParams.set('name', file.name || 'ग्रंथ');
      read.href = bookUrl.href;
      read.textContent = 'पूरे पेज पर पढ़ें';

      const previewFrame = document.createElement('iframe');
      previewFrame.className = 'drive-iframe';
      previewFrame.title = (file.name || 'PDF') + ' का Preview';
      previewFrame.loading = 'lazy';
      previewFrame.src = file.preview || ('https://drive.google.com/file/d/' + encodeURIComponent(file.id) + '/preview');
      previewFrame.style.display = 'block';
      previewFrame.style.width = '100%';
      previewFrame.style.height = '560px';
      previewFrame.style.marginTop = '14px';
      previewFrame.style.border = '1px solid rgba(255,255,255,.15)';
      previewFrame.style.borderRadius = '12px';
      previewFrame.allow = 'autoplay';

      const download = document.createElement('a');
      download.className = 'download';
      download.href = file.download || ('https://drive.google.com/uc?export=download&id=' + encodeURIComponent(file.id));
      download.target = '_blank';
      download.rel = 'noopener noreferrer';
      download.textContent = 'डाउनलोड करें';
      actions.append(read, download);
      item.append(title, previewFrame, actions);
      list.appendChild(item);
    });
    if (!list.children.length) status.textContent = 'इस Drive फ़ोल्डर में अभी कोई PDF नहीं मिली।';

    const search = document.getElementById('drive-pdf-search');
    if (search && !search.dataset.ready) {
      search.dataset.ready = 'true';
      search.addEventListener('input', function() {
        const term = search.value.trim().toLocaleLowerCase('hi');
        let visible = 0;
        Array.from(list.children).forEach(function(card) {
          const match = card.textContent.toLocaleLowerCase('hi').includes(term);
          card.hidden = !match;
          if (match) visible++;
        });
        status.textContent = term
          ? (visible ? visible + ' पुस्तकें मिलीं।' : 'इस नाम से कोई पुस्तक नहीं मिली।')
          : 'कुल ' + list.children.length + ' PDF उपलब्ध हैं।';
      });
    }
  };

  const tag = document.createElement('script');
  tag.src = 'https://script.google.com/macros/s/AKfycbx8GUE-v-_D25t26Iy1k3mo2W2VfyG2Wnh02gsjEVdnOiP9NHUmiHkr0_EjezIhaTLgOw/exec?callback=handleDrivePdfLibrary';
  tag.onerror = function() {
    status.textContent = 'PDF सूची लोड नहीं हो पाई। इंटरनेट कनेक्शन जाँचकर पेज रीफ़्रेश करें।';
  };
  document.head.appendChild(tag);
})();


/* Per-PDF reactions, comments and notification backend. */
(function setupPdfReactions() {
  const STORE = 'devTiwariPdfReactions_v1';
  const NOTIFICATION_ENDPOINT = 'https://script.google.com/macros/s/AKfycby9NvMn0XIybhTvv16hR6YCsDXGysJtJP5SBC0F52LN2WFk-Abp-w98zYnNMdlQAtJh/exec';

  function readVotes() {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}'); }
    catch (e) { return {}; }
  }

  function sendToBackend(payload) {
    return fetch(NOTIFICATION_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  }

  function addReaction(iframe) {
    if (!iframe || iframe.dataset.reactionsAdded === 'true') return;
    const src = iframe.getAttribute('src') || '';
    const match = src.match(/\/d\/([^/]+)\//);
    const id = match ? match[1] : (iframe.title || 'pdf-' + Math.random().toString(36).slice(2));
    const host = iframe.closest('.drive-pdf-item, .card') || iframe.parentElement?.parentElement;
    if (!host) return;

    const bar = document.createElement('section');
    bar.className = 'pdf-reaction-bar';
    bar.dataset.pdfReactionId = id;
    const label = document.createElement('span');
    label.className = 'pdf-reaction-label';
    label.textContent = 'इस PDF पर अपनी राय दें';

    const like = document.createElement('button');
    like.type = 'button';
    like.className = 'pdf-reaction-btn like';
    like.innerHTML = '<i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> पसंद';
    const dislike = document.createElement('button');
    dislike.type = 'button';
    dislike.className = 'pdf-reaction-btn dislike';
    dislike.innerHTML = '<i class="fa-solid fa-thumbs-down" aria-hidden="true"></i> पसंद नहीं';

    const commentLabel = document.createElement('label');
    commentLabel.className = 'pdf-comment-label';
    commentLabel.textContent = 'टिप्पणी / सुझाव लिखें';
    const comment = document.createElement('textarea');
    comment.className = 'pdf-comment-input';
    comment.rows = 2;
    comment.maxLength = 1000;
    comment.placeholder = 'इस पुस्तक के बारे में अपनी राय यहाँ लिखें...';

    const send = document.createElement('button');
    send.type = 'button';
    send.className = 'pdf-comment-send';
    send.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> टिप्पणी भेजें';

    const note = document.createElement('small');
    note.className = 'pdf-reaction-note';
    note.textContent = 'आपकी पसंद और टिप्पणी सुरक्षित रूप से दर्ज होगी। टिप्पणी पर ईमेल सूचना भेजी जाएगी।';

    function titleOfPdf() {
      return host.querySelector('h3, h4, h5')?.textContent?.trim() || iframe.title || 'PDF';
    }

    function render() {
      const votes = readVotes();
      const current = votes[id] || '';
      like.setAttribute('aria-pressed', String(current === 'like'));
      dislike.setAttribute('aria-pressed', String(current === 'dislike'));
    }

    function vote(value) {
      const votes = readVotes();
      const next = votes[id] === value ? '' : value;
      if (next) votes[id] = next; else delete votes[id];
      try { localStorage.setItem(STORE, JSON.stringify(votes)); } catch (e) {}
      render();
      sendToBackend({
        type: value,
        pdfId: id,
        pdfName: titleOfPdf(),
        pageUrl: window.location.href
      }).catch(function() {
        note.textContent = 'प्रतिक्रिया भेजने में समस्या हुई। कृपया पुनः प्रयास करें।';
      });
    }

    like.addEventListener('click', () => vote('like'));
    dislike.addEventListener('click', () => vote('dislike'));

    send.addEventListener('click', function() {
      const message = comment.value.trim();
      if (!message) {
        comment.focus();
        comment.setCustomValidity('कृपया पहले अपनी टिप्पणी लिखें।');
        comment.reportValidity();
        comment.setCustomValidity('');
        return;
      }
      send.disabled = true;
      send.textContent = 'भेज रहे हैं…';
      sendToBackend({
        type: 'comment',
        pdfId: id,
        pdfName: titleOfPdf(),
        comment: message,
        pageUrl: window.location.href
      }).then(function() {
        note.textContent = 'आपकी टिप्पणी भेज दी गई है। धन्यवाद!';
        comment.value = '';
      }).catch(function() {
        note.textContent = 'टिप्पणी भेजने में समस्या हुई। कृपया पुनः प्रयास करें।';
      }).finally(function() {
        send.disabled = false;
        send.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> टिप्पणी भेजें';
      });
    });

    bar.append(label, like, dislike, commentLabel, comment, send, note);
    const target = iframe.closest('.drive-pdf-item, .card');
    if (target) target.appendChild(bar);
    else iframe.parentElement.insertAdjacentElement('afterend', bar);
    iframe.dataset.reactionsAdded = 'true';
    render();
  }

  function scan(root) {
    if (root.matches && root.matches('iframe[src*="/preview"]')) addReaction(root);
    if (root.querySelectorAll) root.querySelectorAll('iframe[src*="/preview"]').forEach(addReaction);
  }
  scan(document);
  const observer = new MutationObserver(records => records.forEach(record =>
    record.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); })
  ));
  observer.observe(document.body, { childList: true, subtree: true });
})();
