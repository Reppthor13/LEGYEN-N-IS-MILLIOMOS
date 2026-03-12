
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM is fully loaded");
    const valaszText = document.getElementById('valasz');
    if (valaszText) {
        valaszText.addEventListener('click', () => console.log("asd"));
    }
});