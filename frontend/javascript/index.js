document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM is fully loaded");
    const valasz4 = document.getElementById('valasz4');
    if (valasz4) {
        valasz4.addEventListener('click', () => console.log("asd"));
    }
});