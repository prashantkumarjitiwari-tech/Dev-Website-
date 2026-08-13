
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
    

});
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

