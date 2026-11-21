
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
