
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
