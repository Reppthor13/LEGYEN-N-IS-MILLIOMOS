document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM is fully loaded");
    const supmit = document.getElementById('supmit');
    if (supmit) {
        supmit.addEventListener('click', () => {
            console.log("asd");
            document.getElementById("jo").value = "";
            document.getElementById("rossz").value = "";
            document.getElementById("ujKerdes").value = "";
            location.href = location.href;
        });
    }
});
